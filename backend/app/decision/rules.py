def passes_filters(rec):
    return rec["confidence"] >= 0.4 and not rec["blocked"]
