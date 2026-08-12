"""
نموذج قاعدة بيانات العقارات
"""
from app import db
from datetime import datetime, timezone


class Property(db.Model):
    __tablename__ = 'properties'

    id = db.Column(db.Integer, primary_key=True)
    neighborhood_id = db.Column(db.Integer, db.ForeignKey('neighborhoods.id'), nullable=True, index=True)
    title = db.Column(db.String(200), nullable=False)
    property_type = db.Column(db.String(50), nullable=False, index=True)  # villa, apartment, land, commercial
    listing_type = db.Column(db.String(20), nullable=False, index=True)   # sale, rent
    price = db.Column(db.Float, nullable=False, index=True)
    area_sqm = db.Column(db.Float, nullable=True)
    bedrooms = db.Column(db.Integer, default=0)
    bathrooms = db.Column(db.Integer, default=0)
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    source_url = db.Column(db.String(500), nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    description = db.Column(db.Text, nullable=True)
    is_featured = db.Column(db.Boolean, default=False, index=True)
    is_verified = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    def price_formatted(self):
        if self.price >= 1_000_000:
            return f"{self.price/1_000_000:.1f} مليون ريال"
        return f"{int(self.price):,} ريال"

    def price_per_sqm(self):
        if self.area_sqm and self.area_sqm > 0:
            return self.price / self.area_sqm
        return 0

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'property_type': self.property_type,
            'listing_type': self.listing_type,
            'price': self.price,
            'price_formatted': self.price_formatted(),
            'area_sqm': self.area_sqm,
            'bedrooms': self.bedrooms,
            'bathrooms': self.bathrooms,
            'lat': self.latitude,
            'lng': self.longitude,
            'image_url': self.image_url,
            'neighborhood_id': self.neighborhood_id,
            'neighborhood_name': self.neighborhood.name_ar if self.neighborhood else '',
            'is_featured': self.is_featured,
        }

    def __repr__(self):
        return f'<Property {self.title}>'
