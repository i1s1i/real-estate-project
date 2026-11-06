"""Database-grounded retrieval and response generation for the property assistant."""

import re
import unicodedata
from typing import Any

from app.models.developer import Developer
from app.models.neighborhood import Neighborhood
from app.models.property import Property

MAX_RESULTS = 3

NEIGHBORHOOD_ALIASES = {
    "Hiteen": ("Hittin", "Al Hittin"),
    "Al Yasmin": ("Yasmin", "Yasmine"),
    "Al Malqa": ("Malqa", "Al-Malqa"),
    "Al Narjis": ("Narjis", "Al-Narjis"),
    "Al Qirawan": ("Qirawan", "Al-Qirawan"),
    "Al Arid": ("Arid", "Al-Arid"),
    "Al Muruj": ("Muruj", "Al-Muruj"),
    "Al Ghadir": ("Ghadir", "Al-Ghadir"),
    "Al Rayyan": ("Rayyan", "Al-Rayyan"),
    "Al Olaya": ("Olaya", "Al-Olaya"),
    "Al Sulaymaniyah": ("Sulaymaniyah", "Al-Sulaymaniyah"),
    "Al Sahafah": ("Sahafah", "Al-Sahafah"),
    "Al Aqiq": ("Aqiq", "Al-Aqiq"),
    "Al Nakheel": ("Nakheel", "Al-Nakheel"),
    "Al Raid": ("Raid", "Al-Raid"),
}

NEIGHBORHOOD_ENGLISH_NAME_OVERRIDES = {"Hiteen": "Hittin"}

PROPERTY_TYPES = {
    "villa": ("villa", ("فيلا", "فلل", "فلل", "villa", "villas")),
    "apartment": ("apartment", ("شقة", "شقق", "apartment", "apartments", "flat")),
    "land": ("land", ("أرض", "ارض", "أراضي", "اراضي", "land", "plot")),
    "commercial": ("commercial", ("تجاري", "محل", "مكتب", "commercial", "shop", "office")),
}

PROPERTY_TYPE_LABELS = {
    "villa": ("فيلا", "Villa"),
    "apartment": ("شقة", "Apartment"),
    "land": ("أرض", "Land"),
    "commercial": ("عقار تجاري", "Commercial property"),
}


def normalize_query(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).lower()
    value = value.translate(str.maketrans({
        "أ": "ا",
        "إ": "ا",
        "آ": "ا",
        "ٱ": "ا",
        "ى": "ي",
        "ة": "ه",
        "۰": "0",
        "۱": "1",
        "۲": "2",
        "۳": "3",
        "۴": "4",
        "۵": "5",
        "۶": "6",
        "۷": "7",
        "۸": "8",
        "۹": "9",
        "٠": "0",
        "١": "1",
        "٢": "2",
        "٣": "3",
        "٤": "4",
        "٥": "5",
        "٦": "6",
        "٧": "7",
        "٨": "8",
        "٩": "9",
    }))
    value = re.sub(r"[\u064b-\u065f\u0670]", "", value)
    return re.sub(r"[^\w]+", " ", value).strip()


def _contains_phrase(query: str, phrase: str) -> bool:
    normalized_phrase = normalize_query(phrase)
    return bool(normalized_phrase) and re.search(
        rf"(?<!\w){re.escape(normalized_phrase)}(?!\w)", query
    ) is not None


def _detect_language(query: str) -> str:
    return "ar" if re.search(r"[\u0600-\u06ff]", query) else "en"


def _find_neighborhoods(query: str) -> list[Neighborhood]:
    matches: list[tuple[int, Neighborhood]] = []
    for neighborhood in Neighborhood.query.order_by(Neighborhood.id).all():
        arabic_name = re.sub(r"^حي\s*", "", neighborhood.name_ar.strip())
        aliases = NEIGHBORHOOD_ALIASES.get(neighborhood.name_en, ())
        names = {neighborhood.name_ar, arabic_name, neighborhood.name_en, *aliases}
        positions = [
            match.start()
            for name in names
            if (match := re.search(
                rf"(?<!\w){re.escape(normalize_query(name))}(?!\w)", query
            ))
        ]
        if positions:
            matches.append((min(positions), neighborhood))
    return [neighborhood for _, neighborhood in sorted(matches, key=lambda match: match[0])]


def _is_comparison(query: str) -> bool:
    return any(_contains_phrase(query, phrase) for phrase in (
        "قارن", "مقارنة", "الفرق", "compare", "comparison", "difference between",
    ))


def _is_best_neighborhood_query(query: str) -> bool:
    return any(_contains_phrase(query, phrase) for phrase in (
        "افضل حي", "افضل الاحياء", "افضل منطقه", "اعلى تقييم",
        "افضل", "best neighborhood", "best neighborhoods", "best area", "top neighborhoods",
        "highest rated neighborhood", "families",
    ))


def _is_property_query(query: str) -> bool:
    terms = (
        "بيع", "للبيع", "شراء", "ايجار", "للايجار", "سعر", "اسعار",
        "عقار", "عقارات", "فيلا", "فلل", "شقه", "شقق", "ارض", "اراضي",
        "property", "properties", "villa", "villas", "apartment", "apartments",
        "land", "plot", "sale", "rent", "price", "prices", "cheapest",
        "affordable", "budget",
    )
    return any(_contains_phrase(query, term) for term in terms)


def _is_developer_query(query: str) -> bool:
    if any(_contains_phrase(query, phrase) for phrase in (
        "مطور", "مطورين", "شركه", "شركة", "developers", "developer", "company",
    )):
        return True
    return any(
        _contains_phrase(query, name)
        for developer in Developer.query.all()
        for name in (developer.name_ar, developer.name_en or "")
    )


def _extract_property_type(query: str) -> str | None:
    for property_type, (_, aliases) in PROPERTY_TYPES.items():
        if any(_contains_phrase(query, alias) for alias in aliases):
            return property_type
    return None


def _extract_listing_type(query: str) -> str | None:
    if any(_contains_phrase(query, phrase) for phrase in (
        "ايجار", "للايجار", "rent", "rental", "for rent",
    )):
        return "rent"
    if any(_contains_phrase(query, phrase) for phrase in (
        "بيع", "للبيع", "شراء", "sale", "for sale", "buy",
    )):
        return "sale"
    return None


def _extract_budget(query: str) -> float | None:
    normalized = unicodedata.normalize("NFKC", query).translate(str.maketrans(
        "٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹", "01234567890123456789"
    )).lower()
    amount = re.search(
        r"(?<!\w)(\d[\d,]*(?:\.\d+)?)\s*(million|مليون)?",
        normalized,
    )
    if not amount:
        return None
    has_limit = any(phrase in normalize_query(query) for phrase in (
        "اقل من", "دون", "حتى", "ميزانيتي", "بحدود", "maximum", "max",
        "under", "below", "within", "budget", "up to",
    ))
    if not has_limit:
        return None
    value = float(amount.group(1).replace(",", ""))
    if amount.group(2):
        value *= 1_000_000
    elif value < 10_000 and value.is_integer():
        value *= 1_000_000
    return value


def _is_ascending_price_query(query: str) -> bool:
    return any(_contains_phrase(query, phrase) for phrase in (
        "ارخص", "اقل سعر", "الاقل", "cheapest", "lowest price", "most affordable",
    ))


def _is_descending_price_query(query: str) -> bool:
    return any(_contains_phrase(query, phrase) for phrase in (
        "اغلى", "اعلى سعر", "most expensive", "highest price",
    ))


def _format_money(value: float, language: str) -> str:
    formatted = f"{value:,.0f}"
    return f"{formatted} SAR" if language == "en" else f"{formatted} ريال"


def _source(kind: str, record_id: int, label: str, label_en: str) -> dict[str, Any]:
    return {"type": kind, "id": record_id, "label": label, "label_en": label_en}


def _neighborhood_source(neighborhood: Neighborhood) -> dict[str, Any]:
    return _source(
        "neighborhood",
        neighborhood.id,
        neighborhood.name_ar,
        NEIGHBORHOOD_ENGLISH_NAME_OVERRIDES.get(
            neighborhood.name_en, neighborhood.name_en
        ),
    )


def _neighborhood_name(neighborhood: Neighborhood, language: str) -> str:
    if language == "en":
        return NEIGHBORHOOD_ENGLISH_NAME_OVERRIDES.get(
            neighborhood.name_en, neighborhood.name_en
        )
    return neighborhood.name_ar


def _answer(reply: str, sources: list[dict[str, Any]], language: str) -> dict[str, Any]:
    return {
        "success": True,
        "reply": reply,
        "sources": sources,
        "language": language,
        "grounded": bool(sources),
    }


def _neighborhood_details(neighborhood: Neighborhood, language: str) -> dict[str, Any]:
    name = _neighborhood_name(neighborhood, language)
    property_count = Property.query.filter_by(neighborhood_id=neighborhood.id).count()
    if language == "en":
        reply = (
            f"**{name} — neighborhood profile**\n\n"
            f"• Infrastructure score: **{int(neighborhood.infrastructure_score)}/100**\n"
            f"• Land price: **{_format_money(neighborhood.land_price_per_sqm, language)}/sqm**\n"
            f"• Average rent: **{_format_money(neighborhood.avg_rent_per_sqm, language)}/sqm**\n"
            f"• Services: {neighborhood.schools_count} schools, {neighborhood.hospitals_count} "
            f"hospitals, {neighborhood.parks_count} parks, and {neighborhood.malls_count} malls.\n"
            f"• Sample listings in the database: **{property_count}**.\n\n"
            "These figures describe the platform's sample data, not current market offers."
        )
    else:
        reply = (
            f"**معلومات حي {name.removeprefix('حي ')}:**\n\n"
            f"• مؤشر البنية التحتية: **{int(neighborhood.infrastructure_score)}/100**\n"
            f"• سعر متر الأرض: **{_format_money(neighborhood.land_price_per_sqm, language)}/م²**\n"
            f"• متوسط الإيجار: **{_format_money(neighborhood.avg_rent_per_sqm, language)}/م²**\n"
            f"• الخدمات: {neighborhood.schools_count} مدارس، {neighborhood.hospitals_count} "
            f"مستشفيات، {neighborhood.parks_count} حدائق، و{neighborhood.malls_count} مجمعات.\n"
            f"• العقارات المسجلة في قاعدة المنصة: **{property_count}**.\n\n"
            "هذه أرقام بيانات العرض التجريبية، وليست عروضاً أو أسعاراً حالية في السوق."
        )
    return {"reply": reply, "source": _neighborhood_source(neighborhood)}


def _comparison_answer(
    neighborhoods: list[Neighborhood], language: str
) -> dict[str, Any]:
    evidence = [_neighborhood_details(item, language) for item in neighborhoods]
    best = max(neighborhoods, key=lambda item: item.infrastructure_score)
    if language == "en":
        rows = [
            f"• **{_neighborhood_name(item, language)}:** infrastructure {int(item.infrastructure_score)}/100; "
            f"land {_format_money(item.land_price_per_sqm, language)}/sqm; "
            f"average rent {_format_money(item.avg_rent_per_sqm, language)}/sqm; "
            f"{item.schools_count} schools, {item.hospitals_count} hospitals, "
            f"{item.parks_count} parks."
            for item in neighborhoods
        ]
        reply = (
            "**Neighborhood comparison**\n\n"
            + "\n".join(rows)
            + f"\n\n**Highest infrastructure score:** {_neighborhood_name(best, language)} "
            f"({int(best.infrastructure_score)}/100). This is an infrastructure ranking, "
            "not a personalized investment recommendation. All figures come from sample data."
        )
    else:
        rows = [
            f"• **{item.name_ar}:** البنية التحتية {int(item.infrastructure_score)}/100؛ "
            f"سعر متر الأرض {_format_money(item.land_price_per_sqm, language)}/م²؛ "
            f"متوسط الإيجار {_format_money(item.avg_rent_per_sqm, language)}/م²؛ "
            f"{item.schools_count} مدارس، {item.hospitals_count} مستشفيات، "
            f"{item.parks_count} حدائق."
            for item in neighborhoods
        ]
        reply = (
            "**مقارنة الأحياء:**\n\n"
            + "\n".join(rows)
            + f"\n\n**التوصية حسب مؤشر البنية التحتية فقط:** {best.name_ar} "
            f"({int(best.infrastructure_score)}/100). هذا لا يمثل توصية استثمارية شخصية؛ "
            "والأرقام من بيانات تجريبية."
        )
    return _answer(reply, [item["source"] for item in evidence], language)


def _best_neighborhoods(language: str) -> dict[str, Any]:
    top = Neighborhood.query.order_by(
        Neighborhood.infrastructure_score.desc(), Neighborhood.id.asc()
    ).limit(MAX_RESULTS).all()
    if language == "en":
        rows = [
            f"• **{_neighborhood_name(item, language)}:** infrastructure {int(item.infrastructure_score)}/100; "
            f"land {_format_money(item.land_price_per_sqm, language)}/sqm."
            for item in top
        ]
        reply = (
            "**Top neighborhoods by infrastructure score in the platform data:**\n\n"
            + "\n".join(rows)
            + "\n\nThis ranks infrastructure only, not investment suitability. Figures are sample data."
        )
    else:
        rows = [
            f"• **{item.name_ar}:** البنية التحتية {int(item.infrastructure_score)}/100؛ "
            f"سعر متر الأرض {_format_money(item.land_price_per_sqm, language)}/م²."
            for item in top
        ]
        reply = (
            "**أعلى الأحياء في مؤشر البنية التحتية ضمن بيانات المنصة:**\n\n"
            + "\n".join(rows)
            + "\n\nالترتيب للبنية التحتية فقط وليس لملاءمة الاستثمار، والأرقام تجريبية."
        )
    return _answer(reply, [_neighborhood_source(item) for item in top], language)


def _property_search(
    query: str,
    neighborhoods: list[Neighborhood],
    language: str,
) -> dict[str, Any]:
    property_type = _extract_property_type(query)
    listing_type = _extract_listing_type(query)
    budget = _extract_budget(query)
    records = Property.query
    filters: list[str] = []
    if property_type:
        records = records.filter_by(property_type=property_type)
        filters.append(PROPERTY_TYPE_LABELS[property_type][language == "en"])
    if listing_type:
        records = records.filter_by(listing_type=listing_type)
        if language == "en":
            filters.append("for rent" if listing_type == "rent" else "for sale")
        else:
            filters.append("للإيجار" if listing_type == "rent" else "للبيع")
    if neighborhoods:
        records = records.filter_by(neighborhood_id=neighborhoods[0].id)
        filters.append(_neighborhood_name(neighborhoods[0], language))
    if budget is not None:
        records = records.filter(Property.price <= budget)

    ascending = (
        _is_ascending_price_query(query)
        or budget is not None
        or not _is_descending_price_query(query)
    )
    records = records.order_by(
        Property.price.asc() if ascending else Property.price.desc()
    )
    total = records.count()
    properties = records.limit(MAX_RESULTS).all()

    if not properties:
        if language == "en":
            reply = "I couldn't find listings matching those filters in the sample database. Try a different type, neighborhood, or budget."
        else:
            reply = "لم أجد عقارات تطابق هذه المعايير في قاعدة البيانات التجريبية. جرّب تغيير النوع أو الحي أو الميزانية."
        return _answer(reply, [], language)

    lines: list[str] = []
    sources: list[dict[str, Any]] = []
    for item in properties:
        neighborhood = item.neighborhood
        if language == "en":
            type_label = PROPERTY_TYPE_LABELS.get(item.property_type, ("عقار", "Property"))[1]
            location = _neighborhood_name(neighborhood, language) if neighborhood else "Riyadh"
            listing = "annual rent" if item.listing_type == "rent" else "sale"
            lines.append(
                f"• **{type_label} in {location}:** {_format_money(item.price, language)} "
                f"({listing})"
            )
        else:
            location = neighborhood.name_ar if neighborhood else "الرياض"
            lines.append(
                f"• **{item.title}:** {_format_money(item.price, language)} "
                f"({'إيجار سنوي' if item.listing_type == 'rent' else 'للبيع'}) في {location}"
            )
        sources.append(_source(
            "property",
            item.id,
            item.title,
            f"{PROPERTY_TYPE_LABELS.get(item.property_type, ('Property', 'Property'))[1]} in "
            f"{_neighborhood_name(neighborhood, 'en') if neighborhood else 'Riyadh'}",
        ))

    if budget is not None:
        if language == "en":
            heading = f"Listings up to {_format_money(budget, language)}"
        else:
            heading = f"عقارات ضمن ميزانية {_format_money(budget, language)}"
    elif language == "en":
        heading = "Matching listings" + (f" — {', '.join(filters)}" if filters else "")
    else:
        heading = "عقارات مطابقة" + (f" — {', '.join(filters)}" if filters else "")

    if language == "en":
        tail = f"\n\nShowing {len(properties)} of {total} matching sample listings. Prices are illustrative, not live offers."
    else:
        tail = f"\n\nتُعرض {len(properties)} من أصل {total} عقاراً مطابقاً في بيانات العينة. الأسعار توضيحية وليست عروضاً مباشرة."
    return _answer(f"**{heading}:**\n\n" + "\n".join(lines) + tail, sources, language)


def _developer_answer(query: str, language: str) -> dict[str, Any]:
    developers = Developer.query.order_by(Developer.id).all()
    matched = [
        developer for developer in developers
        if any(_contains_phrase(query, name) for name in (
            developer.name_ar, developer.name_en or "",
        ))
    ]
    if not matched:
        matched = Developer.query.order_by(
            Developer.market_share_pct.desc(), Developer.id.asc()
        ).limit(MAX_RESULTS).all()
    if language == "en":
        rows = [
            f"• **{item.name_en or item.name_ar}:** {item.total_projects} projects "
            f"({item.delivered_projects} delivered, {item.active_projects} active); "
            f"rating {item.rating:.1f}/5; "
            f"{'WAFI certified' if item.is_wafi_certified else 'not marked WAFI certified'}."
            for item in matched[:MAX_RESULTS]
        ]
        reply = "**Developer records in the platform:**\n\n" + "\n".join(rows) + "\n\nVerify licensing with WAFI before making a decision."
    else:
        rows = [
            f"• **{item.name_ar}:** {item.total_projects} مشروعاً "
            f"({item.delivered_projects} منجز، {item.active_projects} نشط)؛ "
            f"التقييم {item.rating:.1f}/5؛ "
            f"{'موثق لدى وافي' if item.is_wafi_certified else 'غير موضح كموثق لدى وافي'}."
            for item in matched[:MAX_RESULTS]
        ]
        reply = "**سجلات المطورين في المنصة:**\n\n" + "\n".join(rows) + "\n\nتحقق من الترخيص لدى وافي قبل اتخاذ أي قرار."
    sources = [
        _source("developer", item.id, item.name_ar, item.name_en or item.name_ar)
        for item in matched[:MAX_RESULTS]
    ]
    return _answer(reply, sources, language)


def _overview_answer(language: str) -> dict[str, Any]:
    if language == "en":
        reply = (
            f"**Platform sample data:** {Neighborhood.query.count()} neighborhoods, "
            f"{Property.query.count()} property listings, and {Developer.query.count()} developers. "
            "These are demonstration records, not live market statistics."
        )
        source_label = "Platform database overview"
    else:
        reply = (
            f"**بيانات المنصة التجريبية:** {Neighborhood.query.count()} حياً، "
            f"{Property.query.count()} عقاراً، و{Developer.query.count()} مطورين. "
            "هذه سجلات للعرض وليست إحصاءات مباشرة للسوق."
        )
        source_label = "ملخص قاعدة بيانات المنصة"
    source = _source("overview", 0, source_label, source_label)
    return _answer(reply, [source], language)


def answer_query(user_query: str) -> dict[str, Any]:
    """Retrieve relevant live database rows and produce a cited Arabic or English answer."""
    language = _detect_language(user_query)
    query = normalize_query(user_query)
    neighborhoods = _find_neighborhoods(query)

    if _is_comparison(query):
        if len(neighborhoods) < 2:
            reply = (
                "Name at least two Riyadh neighborhoods to compare."
                if language == "en"
                else "اذكر اسم حيين على الأقل حتى أتمكن من المقارنة."
            )
            return _answer(reply, [], language)
        return _comparison_answer(neighborhoods[:4], language)

    if _is_best_neighborhood_query(query) and not _is_property_query(query):
        return _best_neighborhoods(language)

    if _is_property_query(query):
        return _property_search(query, neighborhoods, language)

    if _is_developer_query(query):
        return _developer_answer(query, language)

    if neighborhoods:
        details = [_neighborhood_details(item, language) for item in neighborhoods[:1]]
        return _answer(details[0]["reply"], [details[0]["source"]], language)

    if any(_contains_phrase(query, term) for term in (
        "احصائيات", "بيانات المنصه", "كم عدد", "statistics", "platform data",
        "how many neighborhoods", "how many properties",
    )):
        return _overview_answer(language)

    if language == "en":
        reply = (
            "I couldn't find a matching fact in the platform database. "
            "Try asking about a Riyadh neighborhood, comparing two neighborhoods, "
            "property listings and budgets, or a developer."
        )
    else:
        reply = (
            "لم أجد معلومة مطابقة في قاعدة بيانات المنصة. اسألني عن حي في الرياض، "
            "أو قارن بين حيين، أو ابحث عن عقار ضمن ميزانية، أو عن مطور عقاري."
        )
    return _answer(reply, [], language)
