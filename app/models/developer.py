"""
نموذج قاعدة بيانات المطورين العقاريين
"""
from app import db
from datetime import datetime


class Developer(db.Model):
    __tablename__ = 'developers'

    id = db.Column(db.Integer, primary_key=True)
    name_ar = db.Column(db.String(150), nullable=False)
    name_en = db.Column(db.String(150), nullable=True)
    license_number = db.Column(db.String(50), nullable=True)
    website = db.Column(db.String(200), nullable=True)
    logo_url = db.Column(db.String(500), nullable=True)
    rating = db.Column(db.Float, default=4.0)
    total_projects = db.Column(db.Integer, default=0)
    delivered_projects = db.Column(db.Integer, default=0)
    active_projects = db.Column(db.Integer, default=0)
    established_year = db.Column(db.Integer, nullable=True)
    description = db.Column(db.Text, nullable=True)
    is_wafi_certified = db.Column(db.Boolean, default=False)
    market_share_pct = db.Column(db.Float, default=0.0)

    # Relationships
    projects = db.relationship('DeveloperProject', backref='developer', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name_ar': self.name_ar,
            'name_en': self.name_en,
            'license_number': self.license_number,
            'website': self.website,
            'logo_url': self.logo_url,
            'rating': self.rating,
            'total_projects': self.total_projects,
            'delivered_projects': self.delivered_projects,
            'active_projects': self.active_projects,
            'established_year': self.established_year,
            'description': self.description,
            'is_wafi_certified': self.is_wafi_certified,
            'market_share_pct': self.market_share_pct,
        }

    def __repr__(self):
        return f'<Developer {self.name_ar}>'


class DeveloperProject(db.Model):
    __tablename__ = 'developer_projects'

    id = db.Column(db.Integer, primary_key=True)
    developer_id = db.Column(db.Integer, db.ForeignKey('developers.id'), nullable=False)
    neighborhood_id = db.Column(db.Integer, db.ForeignKey('neighborhoods.id'), nullable=True)
    name_ar = db.Column(db.String(200), nullable=False)
    name_en = db.Column(db.String(200), nullable=True)
    project_type = db.Column(db.String(50), nullable=True)   # residential, commercial, mixed
    total_units = db.Column(db.Integer, default=0)
    sold_units = db.Column(db.Integer, default=0)
    price_from = db.Column(db.Float, nullable=True)
    price_to = db.Column(db.Float, nullable=True)
    completion_date = db.Column(db.String(20), nullable=True)
    is_off_plan = db.Column(db.Boolean, default=True)
    escrow_status = db.Column(db.String(50), default='نشط')
    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)
    image_url = db.Column(db.String(500), nullable=True)

    def to_dict(self):
        sold_pct = (self.sold_units / self.total_units * 100) if self.total_units > 0 else 0
        return {
            'id': self.id,
            'name_ar': self.name_ar,
            'name_en': self.name_en,
            'developer_name': self.developer.name_ar if self.developer else '',
            'neighborhood_name': self.neighborhood.name_ar if self.neighborhood else '',
            'project_type': self.project_type,
            'total_units': self.total_units,
            'sold_units': self.sold_units,
            'sold_pct': round(sold_pct, 1),
            'price_from': self.price_from,
            'price_to': self.price_to,
            'completion_date': self.completion_date,
            'is_off_plan': self.is_off_plan,
            'escrow_status': self.escrow_status,
            'image_url': self.image_url,
        }

    def __repr__(self):
        return f'<DeveloperProject {self.name_ar}>'
