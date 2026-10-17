"""
أدوات مساعدة - تنسيق البيانات
"""


def format_price(price):
    """تنسيق السعر بالريال السعودي"""
    if price >= 1_000_000:
        return f"{price/1_000_000:.1f} مليون ريال"
    elif price >= 1_000:
        return f"{int(price):,} ريال"
    return f"{int(price)} ريال"


def format_area(area_sqm):
    """تنسيق المساحة"""
    if area_sqm >= 10_000:
        return f"{area_sqm/10_000:.2f} هكتار"
    return f"{int(area_sqm):,} م²"


def score_to_color(score):
    """تحويل درجة البنية التحتية إلى لون"""
    if score >= 85:
        return '#10b981'  # Emerald
    elif score >= 70:
        return '#f59e0b'  # Amber
    elif score >= 55:
        return '#f97316'  # Orange
    else:
        return '#ef4444'  # Red


def score_to_grade(score):
    """تحويل الدرجة إلى تقييم نصي"""
    if score >= 90:
        return 'ممتاز'
    elif score >= 80:
        return 'جيد جداً'
    elif score >= 70:
        return 'جيد'
    elif score >= 60:
        return 'متوسط'
    else:
        return 'يحتاج تحسين'



def format_hospitals(count):
    """تنسيق عدد المستشفيات حسب قواعد العدد في اللغة العربية"""
    if count is None:
        count = 0
    count = int(count)
    if count == 0:
        return "لا توجد مستشفيات"
    elif count == 1:
        return "مستشفى واحد"
    elif count == 2:
        return "مستشفيان"
    elif 3 <= count <= 10:
        return f"{count} مستشفيات"
    else:
        return f"{count} مستشفى"


def format_schools(count):
    """تنسيق عدد المدارس حسب قواعد العدد في اللغة العربية"""
    if count is None:
        count = 0
    count = int(count)
    if count == 0:
        return "لا توجد مدارس"
    elif count == 1:
        return "مدرسة واحدة"
    elif count == 2:
        return "مدرستان"
    elif 3 <= count <= 10:
        return f"{count} مدارس"
    else:
        return f"{count} مدرسة"


def format_parks(count):
    """تنسيق عدد الحدائق حسب قواعد العدد في اللغة العربية"""
    if count is None:
        count = 0
    count = int(count)
    if count == 0:
        return "لا توجد حدائق"
    elif count == 1:
        return "حديقة واحدة"
    elif count == 2:
        return "حديقتان"
    elif 3 <= count <= 10:
        return f"{count} حدائق"
    else:
        return f"{count} حديقة"
