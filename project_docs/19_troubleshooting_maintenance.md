# دليل الصيانة وحل المشاكل (Troubleshooting & Maintenance) 🛠️

بما أن النظام يعتمد بشكل كبير على الـ Web Scraping، فإن الصيانة الدورية أمر حتمي. يوضح هذا الملف كيفية التعامل مع الانقطاعات وإصلاح النظام.

## 1. صيانة سكريبت الجلب (Scraper Maintenance)

### المشكلة: موقع "عقار" أو المصدر غير تصميمه وتوقف الـ Scraper!
إذا بدأت تلاحظ أن قاعدة البيانات لا تستقبل عقارات جديدة، أو أن عمود `price` يسجل `NULL`، فهذا يعني أن أكواد הـ HTML (`classes` أو `id`) في الموقع المصدر قد تغيرت.

**خطوات الحل:**
1. افتح الموقع المصدر في متصفحك العادي (Google Chrome).
2. انقر بزر الفأرة الأيمن على السعر واختر **Inspect (فحص)**.
3. لاحظ اسم الـ `class` الجديد.
4. اذهب إلى ملف `app/services/scraper.py`.
5. ابحث عن دالة `parse_html()` وقم بتحديث الـ Selectors الخاصة بمكتبة `BeautifulSoup`.
   *مثال سابق:* `soup.find('div', class_='price-tag')`
   *التحديث:* `soup.find('div', class_='new-price-container')`

### المشكلة: حظر الـ IP (IP Ban)
إذا كان سجل الأخطاء (Error Logs) يعرض الخطأ `HTTP 403 Forbidden` أو `HTTP 429 Too Many Requests`.
- **الحل السريع:** قم بزيادة مدة التأخير `time.sleep()` في `scraper.py` إلى `10` ثوانٍ.
- **الحل الجذري:** قم بشراء خدمة Rotating Residential Proxies وضع بياناتها في ملف `config.py` لكي يتغير الـ IP الخاص بك مع كل طلب.

## 2. قراءة سجلات الأخطاء (Reading Error Logs)
إذا توقف سيرفر `Flask` عن العمل أو أرجع `HTTP 500`:
- **محلياً (Local):** السيرفر يطبع الأخطاء باللون الأحمر في سطر الأوامر (Terminal). انظر إلى آخر سطر يسبق عبارة `Traceback (most recent call last)`.
- **على الاستضافة (Render):** اذهب إلى لوحة تحكم Render وافتح تبويب `Logs`. ابحث عن كلمات مثل `DatabaseError` (مشكلة في SQL) أو `TemplateSyntaxError` (مشكلة في ملفات HTML/Jinja).

## 3. إعادة تهيئة قاعدة البيانات (Database Reset)
إذا تلوثت قاعدة البيانات ببيانات خاطئة، يمكنك تفريغها والبدء من جديد.
**تحذير:** سيتم مسح كل البيانات!
```bash
# احذف ملف قاعدة البيانات القديم
rm instance/app.db

# قم بتهيئة الجداول من جديد
python run.py --init-db

# أعد تحميل حدود الأحياء
python scripts/maintenance/generate_real_boundaries.py
```
