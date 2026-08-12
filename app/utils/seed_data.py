"""
بيانات تجريبية لقاعدة البيانات - أحياء الرياض الحقيقية والموسعة
"""
import json
import random
from app import db
from app.models.neighborhood import Neighborhood
from app.models.property import Property
from app.models.developer import Developer, DeveloperProject
from app.models.park import Park

NEIGHBORHOODS_DATA = [
    {
        'name_ar': 'حي الياسمين', 'name_en': 'Al Yasmin',
        'center_lat': 24.8188, 'center_lng': 46.6288,
        'land_price_per_sqm': 5500, 'avg_rent_per_sqm': 35, 'infrastructure_score': 88,
        'parks_count': 4, 'hospitals_count': 2, 'schools_count': 8, 'malls_count': 2, 'cafes_count': 25,
        'built_area_pct': 78, 'white_land_pct': 22, 'highway_access': 3,
    },
    {
        'name_ar': 'حي الملقا', 'name_en': 'Al Malqa',
        'center_lat': 24.8288, 'center_lng': 46.6388,
        'land_price_per_sqm': 6800, 'avg_rent_per_sqm': 42, 'infrastructure_score': 93,
        'parks_count': 6, 'hospitals_count': 3, 'schools_count': 10, 'malls_count': 3, 'cafes_count': 45,
        'built_area_pct': 82, 'white_land_pct': 18, 'highway_access': 4,
    },
    {
        'name_ar': 'حي النرجس', 'name_en': 'Al Narjis',
        'center_lat': 24.8388, 'center_lng': 46.6488,
        'land_price_per_sqm': 4800, 'avg_rent_per_sqm': 30, 'infrastructure_score': 82,
        'parks_count': 3, 'hospitals_count': 1, 'schools_count': 6, 'malls_count': 1, 'cafes_count': 18,
        'built_area_pct': 65, 'white_land_pct': 35, 'highway_access': 2,
    },
    {
        'name_ar': 'حي القيروان', 'name_en': 'Al Qirawan',
        'center_lat': 24.8488, 'center_lng': 46.5888,
        'land_price_per_sqm': 3900, 'avg_rent_per_sqm': 28, 'infrastructure_score': 75,
        'parks_count': 3, 'hospitals_count': 1, 'schools_count': 5, 'malls_count': 1, 'cafes_count': 12,
        'built_area_pct': 55, 'white_land_pct': 45, 'highway_access': 2,
    },
    {
        'name_ar': 'حي العارض', 'name_en': 'Al Arid',
        'center_lat': 24.8588, 'center_lng': 46.6188,
        'land_price_per_sqm': 3200, 'avg_rent_per_sqm': 22, 'infrastructure_score': 68,
        'parks_count': 2, 'hospitals_count': 1, 'schools_count': 4, 'malls_count': 1, 'cafes_count': 8,
        'built_area_pct': 45, 'white_land_pct': 55, 'highway_access': 2,
    },
    {
        'name_ar': 'حي المروج', 'name_en': 'Al Muruj',
        'center_lat': 24.7388, 'center_lng': 46.6888,
        'land_price_per_sqm': 7200, 'avg_rent_per_sqm': 48, 'infrastructure_score': 95,
        'parks_count': 7, 'hospitals_count': 4, 'schools_count': 12, 'malls_count': 4, 'cafes_count': 60,
        'built_area_pct': 90, 'white_land_pct': 10, 'highway_access': 5,
    },
    {
        'name_ar': 'حي الغدير', 'name_en': 'Al Ghadir',
        'center_lat': 24.7788, 'center_lng': 46.7088,
        'land_price_per_sqm': 5000, 'avg_rent_per_sqm': 33, 'infrastructure_score': 84,
        'parks_count': 5, 'hospitals_count': 2, 'schools_count': 7, 'malls_count': 2, 'cafes_count': 30,
        'built_area_pct': 72, 'white_land_pct': 28, 'highway_access': 3,
    },
    {
        'name_ar': 'حي الريان', 'name_en': 'Al Rayyan',
        'center_lat': 24.6888, 'center_lng': 46.7288,
        'land_price_per_sqm': 4200, 'avg_rent_per_sqm': 27, 'infrastructure_score': 71,
        'parks_count': 2, 'hospitals_count': 1, 'schools_count': 5, 'malls_count': 1, 'cafes_count': 15,
        'built_area_pct': 60, 'white_land_pct': 40, 'highway_access': 2,
    },
    {
        'name_ar': 'حي العليا', 'name_en': 'Al Olaya',
        'center_lat': 24.7081, 'center_lng': 46.6749,
        'land_price_per_sqm': 12000, 'avg_rent_per_sqm': 75, 'infrastructure_score': 98,
        'parks_count': 4, 'hospitals_count': 6, 'schools_count': 15, 'malls_count': 8, 'cafes_count': 120,
        'built_area_pct': 95, 'white_land_pct': 5, 'highway_access': 6,
    },
    {
        'name_ar': 'حي السليمانية', 'name_en': 'Al Sulaymaniyah',
        'center_lat': 24.7051, 'center_lng': 46.6980,
        'land_price_per_sqm': 8500, 'avg_rent_per_sqm': 55, 'infrastructure_score': 91,
        'parks_count': 3, 'hospitals_count': 5, 'schools_count': 11, 'malls_count': 3, 'cafes_count': 80,
        'built_area_pct': 92, 'white_land_pct': 8, 'highway_access': 4,
    },
    {
        'name_ar': 'حي حطين', 'name_en': 'Hiteen',
        'center_lat': 24.7554, 'center_lng': 46.5936,
        'land_price_per_sqm': 8000, 'avg_rent_per_sqm': 50, 'infrastructure_score': 94,
        'parks_count': 8, 'hospitals_count': 3, 'schools_count': 12, 'malls_count': 5, 'cafes_count': 65,
        'built_area_pct': 85, 'white_land_pct': 15, 'highway_access': 5,
    },
    {
        'name_ar': 'حي الصحافة', 'name_en': 'Al Sahafah',
        'center_lat': 24.7951, 'center_lng': 46.6433,
        'land_price_per_sqm': 6200, 'avg_rent_per_sqm': 38, 'infrastructure_score': 89,
        'parks_count': 5, 'hospitals_count': 2, 'schools_count': 9, 'malls_count': 2, 'cafes_count': 35,
        'built_area_pct': 80, 'white_land_pct': 20, 'highway_access': 3,
    },
    {
        'name_ar': 'حي العقيق', 'name_en': 'Al Aqiq',
        'center_lat': 24.7654, 'center_lng': 46.6231,
        'land_price_per_sqm': 6500, 'avg_rent_per_sqm': 40, 'infrastructure_score': 87,
        'parks_count': 4, 'hospitals_count': 2, 'schools_count': 8, 'malls_count': 3, 'cafes_count': 40,
        'built_area_pct': 85, 'white_land_pct': 15, 'highway_access': 4,
    },
    {
        'name_ar': 'حي النخيل', 'name_en': 'Al Nakheel',
        'center_lat': 24.7345, 'center_lng': 46.6225,
        'land_price_per_sqm': 7500, 'avg_rent_per_sqm': 45, 'infrastructure_score': 92,
        'parks_count': 6, 'hospitals_count': 4, 'schools_count': 10, 'malls_count': 4, 'cafes_count': 50,
        'built_area_pct': 88, 'white_land_pct': 12, 'highway_access': 4,
    },
    {
        'name_ar': 'حي الرائد', 'name_en': 'Al Raid',
        'center_lat': 24.7145, 'center_lng': 46.6225,
        'land_price_per_sqm': 6900, 'avg_rent_per_sqm': 43, 'infrastructure_score': 86,
        'parks_count': 3, 'hospitals_count': 2, 'schools_count': 7, 'malls_count': 1, 'cafes_count': 20,
        'built_area_pct': 80, 'white_land_pct': 20, 'highway_access': 3,
    },
]

DEVELOPERS_DATA = [
    {
        'name_ar': 'شركة الماجدية للتطوير العقاري',
        'name_en': 'Al Majedia Real Estate Development',
        'license_number': 'WF-2019-0312',
        'website': 'https://almajedia.com',
        'rating': 4.7,
        'total_projects': 15,
        'delivered_projects': 9,
        'active_projects': 6,
        'established_year': 2009,
        'is_wafi_certified': True,
        'market_share_pct': 18.5,
        'description': 'شركة رائدة في التطوير العقاري السكني الفاخر بمدينة الرياض، متخصصة في الفلل والمجمعات السكنية المتكاملة.',
    },
    {
        'name_ar': 'رسين للتطوير العقاري',
        'name_en': 'Raseen Real Estate',
        'license_number': 'WF-2018-0145',
        'rating': 4.5,
        'total_projects': 22, 'delivered_projects': 14, 'active_projects': 8,
        'established_year': 2011, 'is_wafi_certified': True, 'market_share_pct': 14.2,
    },
    {
        'name_ar': 'دار الأركان',
        'name_en': 'Dar Al Arkan',
        'license_number': 'WF-2015-0087',
        'rating': 4.8,
        'total_projects': 45, 'delivered_projects': 30, 'active_projects': 15,
        'established_year': 1994, 'is_wafi_certified': True, 'market_share_pct': 25.3,
    },
    {
        'name_ar': 'الهلال للتطوير',
        'license_number': 'WF-2020-0421',
        'rating': 4.2,
        'total_projects': 8, 'delivered_projects': 3, 'active_projects': 5,
        'established_year': 2017, 'is_wafi_certified': True, 'market_share_pct': 8.1,
    },
    {
        'name_ar': 'مجموعة إتقان',
        'license_number': 'WF-2016-0255',
        'rating': 4.4,
        'total_projects': 18, 'delivered_projects': 10, 'active_projects': 8,
        'established_year': 2013, 'is_wafi_certified': True, 'market_share_pct': 11.2,
    },
]

PARKS_DATA = [
    {'name_ar': 'ممشى الغدير', 'park_type': 'walkway', 'area_sqm': 180000, 'center_lat': 24.7788, 'center_lng': 46.7088, 'has_gym': True, 'has_playground': True, 'has_cafe': True},
    {'name_ar': 'حديقة الملك سلمان', 'park_type': 'park', 'area_sqm': 1200000, 'center_lat': 24.7136, 'center_lng': 46.7253, 'has_gym': True, 'has_playground': True, 'has_cafe': True},
    {'name_ar': 'حديقة الياسمين', 'park_type': 'park', 'area_sqm': 45000, 'center_lat': 24.8188, 'center_lng': 46.6288, 'has_gym': False, 'has_playground': True, 'has_cafe': False},
    {'name_ar': 'حديقة الملقا المركزية', 'park_type': 'garden', 'area_sqm': 32000, 'center_lat': 24.8288, 'center_lng': 46.6388, 'has_gym': True, 'has_playground': True, 'has_cafe': True},
    {'name_ar': 'حديقة العليا', 'park_type': 'garden', 'area_sqm': 22000, 'center_lat': 24.7081, 'center_lng': 46.6749, 'has_gym': False, 'has_playground': True, 'has_cafe': True},
]

PROPERTY_TYPES = ['villa', 'apartment', 'land', 'commercial']
LISTING_TYPES = ['sale', 'rent']
TITLES = {
    'villa': ['فيلا فاخرة', 'فيلا مميزة', 'فيلا دوبلكس', 'فيلا عصرية', 'قصر سكني', 'فيلا بتصميم مودرن', 'فيلا زاوية'],
    'apartment': ['شقة أنيقة', 'شقة مفروشة', 'شقة عصرية', 'شقة واسعة', 'استوديو فاخر', 'شقة بنظام ذكي', 'روف مع تراس'],
    'land': ['أرض سكنية', 'أرض تجارية', 'أرض زاوية', 'أرض استثمارية', 'قطعة أرض مميزة'],
    'commercial': ['محل تجاري', 'مكتب احترافي', 'مستودع تجاري', 'برج إداري', 'صالة عرض'],
}

def seed_database():
    """ملء قاعدة البيانات بالبيانات التجريبية"""
    # Seed neighborhoods
    neighborhoods = []
    for data in NEIGHBORHOODS_DATA:
        # Generate some fake historical price data for charting
        base_price = data['land_price_per_sqm']
        history = {
            'labels': ['2020', '2021', '2022', '2023', '2024', '2025'],
            'prices': [
                base_price * 0.6,
                base_price * 0.65,
                base_price * 0.75,
                base_price * 0.85,
                base_price * 0.95,
                base_price
            ]
        }
        # Assuming we can store history somewhere, but the current model does not have a JSON column for it.
        # Actually, `infrastructure_score` is used in charts, let's keep it. 
        # I'll just save the normal model. We'll handle history globally in the stats page.
        
        n = Neighborhood(**data)
        db.session.add(n)
        neighborhoods.append(n)
    db.session.commit()

    # Seed developers
    developers = []
    for data in DEVELOPERS_DATA:
        d = Developer(**data)
        db.session.add(d)
        developers.append(d)
    db.session.commit()

    # Seed parks
    for i, data in enumerate(PARKS_DATA):
        p = Park(**data)
        if i < len(neighborhoods):
            p.neighborhood_id = neighborhoods[i].id
        db.session.add(p)
    db.session.commit()

    # Seed properties (Increase to 500)
    property_images = [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
        'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
        'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=800'
    ]

    for i in range(500):
        neighborhood = random.choice(neighborhoods)
        prop_type = random.choices(PROPERTY_TYPES, weights=[40, 40, 10, 10])[0]
        listing_type = random.choices(LISTING_TYPES, weights=[60, 40])[0]

        base_multiplier = neighborhood.land_price_per_sqm / 5000.0

        if listing_type == 'sale':
            if prop_type == 'villa': price = random.uniform(1_200_000, 5_000_000) * base_multiplier
            elif prop_type == 'apartment': price = random.uniform(500_000, 1_500_000) * base_multiplier
            elif prop_type == 'land': price = random.uniform(800_000, 4_000_000) * base_multiplier
            else: price = random.uniform(1_000_000, 6_000_000) * base_multiplier
        else:
            if prop_type == 'villa': price = random.uniform(40_000, 120_000) * base_multiplier
            elif prop_type == 'apartment': price = random.uniform(25_000, 70_000) * base_multiplier
            elif prop_type == 'land': price = random.uniform(10_000, 50_000) * base_multiplier
            else: price = random.uniform(50_000, 200_000) * base_multiplier

        area = random.uniform(150, 800) if prop_type != 'land' else random.uniform(400, 2000)
        bedrooms = random.randint(2, 7) if prop_type in ['villa', 'apartment'] else 0
        title_name = random.choice(TITLES[prop_type])
        title = f"{title_name} في {neighborhood.name_ar}"

        lat = neighborhood.center_lat + random.uniform(-0.025, 0.025)
        lng = neighborhood.center_lng + random.uniform(-0.025, 0.025)

        p = Property(
            neighborhood_id=neighborhood.id,
            title=title,
            property_type=prop_type,
            listing_type=listing_type,
            price=round(price, -3), # round to nearest 1000
            area_sqm=round(area, 1),
            bedrooms=bedrooms,
            bathrooms=max(1, bedrooms - 1),
            latitude=round(lat, 6),
            longitude=round(lng, 6),
            image_url=random.choice(property_images),
            is_featured=(random.random() < 0.05), # 5% chance to be featured
            description=f"عقار مميز في {neighborhood.name_ar} بموقع استراتيجي قريب من الخدمات.",
        )
        db.session.add(p)

    db.session.commit()
    print(f"تم إضافة {len(neighborhoods)} حياً، {len(developers)} مطور، و 500 عقار بنجاح.")
