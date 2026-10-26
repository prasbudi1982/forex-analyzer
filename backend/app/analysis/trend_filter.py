def alignment(htf_trend, ltf_trend):
    return htf_trend == ltf_trend and htf_trend in ("bull", "bear")
