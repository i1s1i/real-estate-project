"""
نموذج قاعدة بيانات الحدائق والمتنزهات
"""
from app import db


class Park(db.Model):
    __tablename__ = 'parks'

    id = db.Column(db.Integer, primary_key=True)
    neighborhood_id = db.Column(db.Integer, db.ForeignKey('neighborhoods.id'), nullable=True)
    name_ar = db.Column(db.String(150), nullable=False)
    name_en = db.Column(db.String(150), nullable=True)
    park_type = db.Column(db.String(50), default='park')  # park, walkway, garden
    area_sqm = db.Column(db.Float, default=0.0)
    boundaries_geojson = db.Column(db.Text, nullable=True)
    center_lat = db.Column(db.Float, nullable=True)
    center_lng = db.Column(db.Float, nullable=True)
    has_gym = db.Column(db.Boolean, default=False)
    has_playground = db.Column(db.Boolean, default=False)
    has_cafe = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name_ar': self.name_ar,
            'name_en': self.name_en,
            'park_type': self.park_type,
            'area_sqm': self.area_sqm,
            'center_lat': self.center_lat,
            'center_lng': self.center_lng,
            'has_gym': self.has_gym,
            'has_playground': self.has_playground,
            'has_cafe': self.has_cafe,
            'boundaries_geojson': self.boundaries_geojson,
        }

    def __repr__(self):
        return f'<Park {self.name_ar}>'
