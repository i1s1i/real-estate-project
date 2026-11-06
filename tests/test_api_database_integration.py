import json
import re


def test_api_responses_are_connected_to_seeded_database(site_page):
    def get_json(path):
        response = site_page.request.get(f"{site_page.url.rstrip('/')}{path}")
        assert response.status == 200, path
        return response.json()

    health = get_json("/api/ping")
    assert health["status"] == "ok"

    neighborhoods = get_json("/api/neighborhoods")["data"]
    developers = get_json("/api/developers")["data"]
    overview = get_json("/api/stats/overview")["data"]

    assert overview["total_neighborhoods"] == len(neighborhoods) == 15
    assert overview["total_developers"] == len(developers) == 5
    assert overview["total_properties"] == 500
    assert overview["sale_count"] + overview["rent_count"] == overview["total_properties"]

    geojson = get_json("/api/map/neighborhoods")
    parks = get_json("/api/map/parks")
    map_properties = get_json("/api/map/properties")
    assert geojson["type"] == parks["type"] == "FeatureCollection"
    assert len(geojson["features"]) == len(neighborhoods)
    assert all(feature["geometry"]["type"] == "Point" for feature in geojson["features"])
    assert len(parks["features"]) == 5
    assert all(feature["geometry"]["type"] == "Point" for feature in parks["features"])
    assert map_properties["count"] > 0
    assert all(
        item["lat"] is not None and item["lng"] is not None
        for item in map_properties["data"]
    )

    filtered = get_json("/api/properties/search?type=villa&listing=sale")
    assert 0 < filtered["count"] <= 50
    assert all(
        item["property_type"] == "villa" and item["listing_type"] == "sale"
        for item in filtered["data"]
    )

    property_id = filtered["data"][0]["id"]
    detail = get_json(f"/api/properties/{property_id}")["data"]
    assert detail["id"] == property_id
    assert detail["neighborhood_id"] in {item["id"] for item in neighborhoods}

    neighborhood_id = detail["neighborhood_id"]
    neighborhood = get_json(f"/api/neighborhoods/{neighborhood_id}")["data"]
    assert neighborhood["property_count"] > 0
    assert len(neighborhood["price_history"]["labels"]) == len(
        neighborhood["price_history"]["prices"]
    )
    comparison = get_json(
        f"/api/neighborhoods/compare?ids={neighborhood_id}&ids={neighborhoods[0]['id']}"
    )
    assert comparison["success"] is True
    assert len(comparison["data"]) == 2

    ranking = get_json("/api/stats/neighborhoods-ranking?sort=land_price")["data"]
    assert ranking[0]["land_price_per_sqm"] >= ranking[-1]["land_price_per_sqm"]

    chat_response = site_page.request.post(
        f"{site_page.url.rstrip('/')}/api/ai/chat",
        data=json.dumps({"query": "ما هي مميزات حي الملقا؟"}),
        headers={"Content-Type": "application/json"},
    )
    assert chat_response.status == 200
    assert "حي الملقا" in chat_response.json()["reply"]
    assert chat_response.json()["grounded"] is True
    assert chat_response.json()["sources"][0]["type"] == "neighborhood"

    missing_property = site_page.request.get(
        f"{site_page.url.rstrip('/')}/api/properties/999999"
    )
    assert missing_property.status == 404


def test_ai_chat_retrieves_relevant_records_in_both_languages(site_page):
    endpoint = f"{site_page.url.rstrip('/')}/api/ai/chat"

    def ask(query):
        response = site_page.request.post(
            endpoint,
            data=json.dumps({"query": query}),
            headers={"Content-Type": "application/json"},
        )
        assert response.status == 200
        return response.json()

    comparison = ask("Compare Hittin and Al Malqa")
    assert comparison["language"] == "en"
    assert len(comparison["sources"]) == 2
    assert any(source["label_en"] == "Hittin" for source in comparison["sources"])
    assert all(source["label_en"] in comparison["reply"] for source in comparison["sources"])

    budget_search = ask("Show villas for sale under 20 million")
    assert budget_search["language"] == "en"
    assert budget_search["sources"]
    assert all(source["type"] == "property" for source in budget_search["sources"])
    assert "20,000,000 SAR" in budget_search["reply"]

    cheapest = ask("Show the cheapest villas for sale")
    prices = [
        int(price.replace(",", ""))
        for price in re.findall(r"\*\*[^*\n]+:\*\* ([\d,]+) SAR", cheapest["reply"])
    ]
    assert prices and prices == sorted(prices)

    developers = ask("List real estate developers")
    assert developers["sources"]
    assert all(source["type"] == "developer" for source in developers["sources"])

    unsupported = ask("What is the weather on Mars?")
    assert unsupported["grounded"] is False
    assert unsupported["sources"] == []


def test_ai_chat_rejects_invalid_questions(site_page):
    endpoint = f"{site_page.url.rstrip('/')}/api/ai/chat"
    invalid_requests = (
        ("not-json", {"Content-Type": "application/json"}),
        (json.dumps({"query": ""}), {"Content-Type": "application/json"}),
        (json.dumps({"query": "x" * 501}), {"Content-Type": "application/json"}),
    )

    for body, headers in invalid_requests:
        response = site_page.request.post(endpoint, data=body, headers=headers)
        assert response.status == 400
        assert response.json()["success"] is False
