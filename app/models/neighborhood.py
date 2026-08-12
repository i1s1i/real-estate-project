"""
نموذج قاعدة بيانات الأحياء
"""
from app import db
import json


class Neighborhood(db.Model):
    __tablename__ = 'neighborhoods'

    id = db.Column(db.Integer, primary_key=True)
    name_ar = db.Column(db.String(100), nullable=False, index=True)
    name_en = db.Column(db.String(100), nullable=False)
    boundaries_geojson = db.Column(db.Text, nullable=True)  # GeoJSON polygon
    land_price_per_sqm = db.Column(db.Float, default=0.0, index=True)
    avg_rent_per_sqm = db.Column(db.Float, default=0.0)
    infrastructure_score = db.Column(db.Float, default=0.0, index=True)  # 0-100
    sun_angle_summer = db.Column(db.Float, default=0.0)
    sun_angle_winter = db.Column(db.Float, default=0.0)
    parks_count = db.Column(db.Integer, default=0)
    hospitals_count = db.Column(db.Integer, default=0)
    schools_count = db.Column(db.Integer, default=0)
    malls_count = db.Column(db.Integer, default=0)
    cafes_count = db.Column(db.Integer, default=0)
    center_lat = db.Column(db.Float, default=24.7136)
    center_lng = db.Column(db.Float, default=46.6753)
    built_area_pct = db.Column(db.Float, default=70.0)
    white_land_pct = db.Column(db.Float, default=30.0)
    highway_access = db.Column(db.Integer, default=2)

    # Relationships
    properties = db.relationship('Property', backref='neighborhood', lazy='dynamic')
    parks = db.relationship('Park', backref='neighborhood', lazy='dynamic')
    developer_projects = db.relationship('DeveloperProject', backref='neighborhood', lazy='dynamic')

    def to_geojson_feature(self):
        boundaries = json.loads(self.boundaries_geojson) if self.boundaries_geojson else None
        return {
            'type': 'Feature',
            'geometry': boundaries,
            'properties': {
                'id': self.id,
                'name_ar': self.name_ar,
                'name_en': self.name_en,
                'infrastructure_score': self.infrastructure_score,
                'land_price_per_sqm': self.land_price_per_sqm,
                'avg_rent_per_sqm': self.avg_rent_per_sqm,
                'parks_count': self.parks_count,
                'hospitals_count': self.hospitals_count,
                'schools_count': self.schools_count,
                'center_lat': self.center_lat,
                'center_lng': self.center_lng,
            }
        }

    def to_dict(self):
        return {
            'id': self.id,
            'name_ar': self.name_ar,
            'name_en': self.name_en,
            'land_price_per_sqm': self.land_price_per_sqm,
            'avg_rent_per_sqm': self.avg_rent_per_sqm,
            'infrastructure_score': self.infrastructure_score,
            'parks_count': self.parks_count,
            'hospitals_count': self.hospitals_count,
            'schools_count': self.schools_count,
            'malls_count': self.malls_count,
            'cafes_count': self.cafes_count,
            'center_lat': self.center_lat,
            'center_lng': self.center_lng,
            'built_area_pct': self.built_area_pct,
            'white_land_pct': self.white_land_pct,
            'highway_access': self.highway_access,
        }

    def __repr__(self):
        return f'<Neighborhood {self.name_ar}>'
