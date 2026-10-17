import re
from time import perf_counter

import pytest
from playwright.sync_api import expect


@pytest.mark.parametrize(
    ("path", "marker"),
    [
        ("/", ".hero h1"),
        ("/map", "#map"),
        ("/properties", "main h1"),
        ("/compare", "main h1"),
        ("/statistics", "main h1"),
        ("/developers", "main h1"),
    ],
)
def test_primary_pages_render(site_page, live_server, path, marker):
    response = site_page.goto(f"{live_server}{path}", wait_until="domcontentloaded")

    assert response is not None
    assert response.status == 200
    expect(site_page.locator(marker)).to_be_visible()
    expect(site_page.locator("main")).to_be_visible()
    assert site_page.locator("nav#navbar a.nav-link.active").count() == 1


def test_home_search_navigates_to_filtered_results(site_page):
    site_page.locator("#search-form select[name='type']").select_option("villa")
    site_page.locator("#search-form select[name='listing']").select_option("sale")
    site_page.locator("#search-form").get_by_role("button", name=re.compile("بحث")).click()

    expect(site_page).to_have_url(re.compile(r"/properties\?listing=sale&type=villa"))
    expect(site_page.locator(".property-card").first).to_be_visible()
    assert site_page.locator(".filters-bar select[name='type']").input_value() == "villa"
    assert site_page.locator(".filters-bar select[name='listing']").input_value() == "sale"
    assert site_page.locator(".property-card .badge-sale").count() == site_page.locator(
        ".property-card"
    ).count()


def test_property_filters_and_reset(site_page, live_server):
    site_page.goto(f"{live_server}/properties", wait_until="domcontentloaded")
    filters = site_page.locator(".filters-bar")
    filters.locator("select[name='type']").select_option("apartment")
    filters.locator("select[name='listing']").select_option("rent")
    filters.get_by_role("button", name=re.compile("تصفية")).click()

    expect(site_page).to_have_url(re.compile(r"/properties\?.*type=apartment.*listing=rent"))
    cards = site_page.locator(".property-card")
    expect(cards.first).to_be_visible()
    assert cards.locator(".badge-rent").count() == cards.count()
    assert cards.locator(".badge-sale").count() == 0

    site_page.get_by_role("link", name=re.compile("إعادة")).click()
    expect(site_page).to_have_url(re.compile(r"/properties$"))
    assert site_page.locator(".property-card").count() == 12


def test_property_details_modal_opens_and_closes(site_page, live_server):
    site_page.goto(f"{live_server}/properties", wait_until="domcontentloaded")
    site_page.locator(".property-card button").first.click()

    modal = site_page.locator("#propertyDetailsModal")
    expect(modal).to_have_class(re.compile(r"\bactive\b"))
    expect(site_page.locator("#modalPropertyTitle")).not_to_be_empty()
    expect(site_page.locator("#modalPropertyPrice")).not_to_be_empty()
    expect(site_page.locator("#modalMapLink")).to_have_attribute("href", re.compile(r"/map\?prop_id=\d+"))

    site_page.locator(".property-modal-close").click()
    expect(modal).not_to_have_class(re.compile(r"\bactive\b"))


def test_neighborhood_comparison_renders_selected_neighborhoods(site_page, live_server):
    site_page.goto(f"{live_server}/compare", wait_until="domcontentloaded")
    selections = site_page.locator(".compare-select")
    selections.nth(0).select_option(index=1)
    selections.nth(1).select_option(index=2)

    selected_names = [
        selections.nth(index).locator("option:checked").inner_text()
        for index in range(2)
    ]
    site_page.get_by_role("button", name=re.compile("عرض المقارنة")).click()

    cards = site_page.locator("#compare-results .compare-card")
    expect(cards).to_have_count(2)
    for name in selected_names:
        expect(site_page.locator("#compare-results")).to_contain_text(name)
    expect(site_page.locator("#charts-section")).to_be_visible()


def test_theme_and_language_preferences_persist(site_page):
    site_page.locator("#themeToggle").click()
    expect(site_page.locator("html")).to_have_attribute("data-theme", "light")
    site_page.locator("#langToggle").click()
    expect(site_page.locator("html")).to_have_attribute("lang", "en")
    expect(site_page.locator("html")).to_have_attribute("dir", "ltr")
    expect(site_page.locator("#nav-links")).to_contain_text("Home")

    site_page.reload(wait_until="domcontentloaded")
    expect(site_page.locator("html")).to_have_attribute("data-theme", "light")
    expect(site_page.locator("html")).to_have_attribute("lang", "en")
    expect(site_page.locator("html")).to_have_attribute("dir", "ltr")


def test_home_neighborhood_stats_remain_legible_in_light_theme(site_page):
    site_page.locator("#themeToggle").click()
    stats = site_page.locator(".neighborhood-stats .stat-pill").first
    expect(stats).to_be_visible()

    contrast_ratio = stats.evaluate(
        """element => {
          const rgb = value => value.match(/[\\d.]+/g).slice(0, 3).map(Number);
          const luminance = color => {
            const channels = rgb(color).map(channel => {
              const normalized = channel / 255;
              return normalized <= 0.04045
                ? normalized / 12.92
                : ((normalized + 0.055) / 1.055) ** 2.4;
            });
            return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
          };
          const style = getComputedStyle(element);
          const foreground = luminance(style.color);
          const background = luminance(style.backgroundColor);
          return (Math.max(foreground, background) + 0.05)
            / (Math.min(foreground, background) + 0.05);
        }"""
    )
    assert contrast_ratio >= 4.5


def test_ai_advisor_compares_three_neighborhoods_in_chat(site_page):
    advisor = site_page.locator("#aiAdvisorFab")
    advisor.click()

    chat_input = site_page.locator("#aiChatInput")
    chat_input.fill("قارن بين حطين و النخيل و الملقا")
    chat_input.press("Enter")

    reply = site_page.locator("#aiChatMessages .chat-bubble.bot").last
    expect(reply).to_contain_text("حي حطين")
    expect(reply).to_contain_text("حي النخيل")
    expect(reply).to_contain_text("حي الملقا")
    expect(reply).to_contain_text("التوصية")
    reply_text = reply.inner_text()
    assert reply_text.index("حي حطين") < reply_text.index("حي النخيل") < reply_text.index("حي الملقا")
    expect(chat_input).to_have_value("")


def test_mobile_navigation_opens_and_closes(site_page):
    site_page.set_viewport_size({"width": 390, "height": 844})
    menu_button = site_page.get_by_role("button", name="القائمة")
    bounds = menu_button.bounding_box()
    assert bounds is not None
    assert bounds["width"] >= 44
    assert bounds["height"] >= 44

    menu_button.click()
    expect(site_page.locator("#nav-links")).to_have_class(re.compile(r"\bopen\b"))
    expect(menu_button).to_have_attribute("aria-expanded", "true")
    menu_button.press("Escape")
    expect(site_page.locator("#nav-links")).not_to_have_class(re.compile(r"\bopen\b"))
    expect(menu_button).to_have_attribute("aria-expanded", "false")
    site_page.wait_for_timeout(250)
    menu_button.click()
    expect(site_page.locator("#nav-links")).to_be_visible()
    site_page.wait_for_timeout(250)
    property_link = site_page.locator("#nav-links").get_by_role("link", name="العقارات")
    hit_test = property_link.evaluate(
        """element => {
          const rect = element.getBoundingClientRect();
          const topElement = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
          const panel = element.parentElement.parentElement;
          return {
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            position: getComputedStyle(panel).position,
            right: getComputedStyle(panel).right,
            viewport: { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, scrollX },
            panel: panel.getBoundingClientRect().toJSON(),
            hit: topElement?.outerHTML.slice(0, 120)
          };
        }"""
    )
    assert property_link.evaluate(
        """element => {
          const rect = element.getBoundingClientRect();
          const topElement = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
          return topElement === element || element.contains(topElement);
        }"""
    ), f"Mobile navigation link is not tappable: {hit_test}"
    property_link.click()
    expect(site_page).to_have_url(re.compile(r"/properties$"))
    expect(site_page.locator("#nav-links")).not_to_have_class(re.compile(r"\bopen\b"))


def test_mobile_layout_has_no_horizontal_overflow(site_page, live_server):
    site_page.set_viewport_size({"width": 390, "height": 844})
    for path in ("/", "/properties", "/compare", "/developers"):
        site_page.goto(f"{live_server}{path}", wait_until="domcontentloaded")
        dimensions = site_page.evaluate(
            """() => ({
              viewport: document.documentElement.clientWidth,
              page: document.documentElement.scrollWidth,
              overflowing: [...document.querySelectorAll('body *')]
                .filter(element => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
                .slice(0, 3)
                .map(element => `${element.tagName.toLowerCase()}.${element.className}`)
            })"""
        )
        assert dimensions["page"] <= dimensions["viewport"], f"{path} overflows: {dimensions}"


def test_ai_advisor_is_accessible_and_usable_on_mobile(site_page):
    site_page.set_viewport_size({"width": 390, "height": 844})
    advisor = site_page.get_by_role("button", name="مستشار عقار ذكي")
    bounds = advisor.bounding_box()
    assert bounds is not None
    assert bounds["width"] >= 44
    assert bounds["height"] >= 44

    advisor.click()
    expect(site_page.locator("#aiChatDrawer")).to_have_class(re.compile(r"\bopen\b"))
    expect(site_page.locator("#aiChatInput")).to_be_focused()
    site_page.get_by_role("button", name="إغلاق المستشار").click()
    expect(site_page.locator("#aiChatDrawer")).not_to_have_class(re.compile(r"\bopen\b"))


def test_homepage_initial_render_meets_performance_budget(site_page, live_server):
    started = perf_counter()
    site_page.goto(f"{live_server}/", wait_until="domcontentloaded")
    timings = site_page.evaluate(
        """() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          return {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
            thirdPartyMapRequests: performance.getEntriesByType('resource').filter(entry =>
              /unpkg\\.com\\/leaflet|tile\\.openstreetmap\\.org/.test(entry.name)
            ).length
          };
        }"""
    )
    site_page.screenshot(animations="disabled")
    timings["firstViewportRendered"] = (perf_counter() - started) * 1000

    assert timings["domContentLoaded"] < 5000, timings
    assert timings["firstViewportRendered"] < 5000, timings
    assert timings["thirdPartyMapRequests"] == 0, timings


def test_map_mobile_sidebar_toggle(site_page, live_server):
    site_page.set_viewport_size({"width": 390, "height": 844})
    site_page.goto(f"{live_server}/map", wait_until="domcontentloaded")

    sidebar = site_page.locator(".map-sidebar")
    toggle = site_page.locator("#map-sidebar-toggle")
    toggle.click()
    expect(sidebar).to_have_class(re.compile(r"\bopen\b"))
    toggle.click()
    expect(sidebar).not_to_have_class(re.compile(r"\bopen\b"))


def test_admin_route_requires_login_and_accepts_test_credentials(site_page, live_server):
    site_page.goto(f"{live_server}/admin/dashboard", wait_until="domcontentloaded")
    expect(site_page).to_have_url(re.compile(r"/admin/login$"))

    site_page.locator("input[name='username']").fill("browser-admin")
    site_page.locator("input[name='password']").fill("browser-test-password")
    site_page.get_by_role("button", name=re.compile("دخول")).click()

    expect(site_page).to_have_url(re.compile(r"/admin/dashboard$"))
    expect(site_page.locator("main")).to_contain_text("لوحة الإدارة")
