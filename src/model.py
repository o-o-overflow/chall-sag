import random

N = 32

def count(t):
    a = t[:]
    cnt = 0
    for i in xrange(N):
        for j in xrange(i + 1, N):
            if a[i] > a[j]:
                cnt += 1
                a[i], a[j] = a[j], a[i]
    return cnt

mask = random.randint(0, 2 ** 32 - 1)
print 'mask', hex(mask)
best = N * (N - 1) / 2
attempts = 0
while True:
    attempts += 1
    r = [random.randint(0, 2 ** 32 - 1) ^ mask for _ in xrange(N)]
    cnt = count(r)
    if cnt < best:
        best = cnt
        print attempts, best
