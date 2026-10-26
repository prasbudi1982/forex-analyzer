def bullish_engulfing(prev, curr):
    po, pc = prev
    co, cc = curr
    return pc < po and cc > co and cc > po and co < pc

def bearish_engulfing(prev, curr):
    po, pc = prev
    co, cc = curr
    return pc > po and cc < co and cc < po and co > pc
