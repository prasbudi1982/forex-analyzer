def classic_pivot(h, l, c):
    p = (h + l + c) / 3
    return {
        "P": p,
        "R1": 2 * p - l, "S1": 2 * p - h,
        "R2": p + (h - l), "S2": p - (h - l),
        "R3": h + 2 * (p - l), "S3": l - 2 * (h - p),
    }
