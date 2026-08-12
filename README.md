# Smart Real Estate Platform (منصة العقار الذكي)

A data-driven web application for exploring, analyzing, and comparing real estate properties across Riyadh neighborhoods.

## 🌟 Overview
The Smart Real Estate Platform addresses the need for transparent, data-driven real estate decisions in Riyadh. By providing interactive maps, comprehensive neighborhood statistics, and side-by-side comparisons, it empowers buyers and investors to evaluate infrastructure quality, price trends, and developer credibility effortlessly.

## ✨ Features
- **Interactive Map Search**: Browse properties on a map with data-rich clusters and heatmaps.
- **Neighborhood Comparison**: Compare up to 3 neighborhoods side-by-side across various metrics (prices, infrastructure score, amenities).
- **Advanced Filtering**: Filter listings by type, price, area, and verified developers.
- **Dynamic Statistics Dashboard**: Real-time charts showing price histories and market trends.
- **High-Contrast Dark/Light Mode**: Premium, accessible user interface optimized for readability.
- **Bilingual Support**: Full Arabic and English interface with seamless toggling.

## 🛠️ Tech Stack
- **Backend**: Python, Flask, SQLAlchemy
- **Frontend**: HTML5, CSS3, Vanilla JavaScript, Jinja2
- **Mapping**: Leaflet.js (CartoDB tiles)
- **Performance**: Flask-Caching, Flask-Compress

## 📸 Screenshots
*(Insert Homepage Screenshot Here)*
*(Insert Map View Screenshot Here)*

## 🚀 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/real-estate-project.git
   cd "real estate project"
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Initialize the Database:**
   ```bash
   flask db upgrade
   ```

## 💻 Usage

Run the development server:
```bash
python run.py
```
Then navigate to `http://127.0.0.1:5000` in your web browser.

## 📂 Project Structure
- `/app`: Main application package (models, routes, API endpoints)
- `/templates`: Jinja2 HTML templates
- `/static`: CSS, JavaScript, and image assets
- `config.py`: Environment configurations
- `run.py`: Application entry point

## 🔮 Future Improvements
- [ ] Integrate a real database (PostgreSQL) for production instead of SQLite.
- [ ] Implement user authentication for saving favorite properties.
- [ ] Add automated unit and integration testing.
- [ ] Containerize the application using Docker.
