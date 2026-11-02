"""Minimal, dependency-light geodesy helpers used to verify the study note."""
import math

# WGS 84 ellipsoid (EPSG:7030)
A = 6378137.0
INV_F = 298.257223563
F = 1.0 / INV_F
B = A * (1 - F)
E2 = F * (2 - F)
R_MEAN = 6371008.8  # IUGG mean radius, used for haversine


def haversine(lat1, lon1, lat2, lon2, r=R_MEAN):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = p2 - p1
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def vincenty_inverse(lat1, lon1, lat2, lon2, tol=1e-12, maxit=200):
    """Geodesic distance (m) on the WGS 84 ellipsoid (Vincenty 1975). Not for nearly antipodal points."""
    L = math.radians(lon2 - lon1)
    U1 = math.atan((1 - F) * math.tan(math.radians(lat1)))
    U2 = math.atan((1 - F) * math.tan(math.radians(lat2)))
    sU1, cU1, sU2, cU2 = math.sin(U1), math.cos(U1), math.sin(U2), math.cos(U2)
    lam = L
    for _ in range(maxit):
        sl, cl = math.sin(lam), math.cos(lam)
        sin_sigma = math.hypot(cU2 * sl, cU1 * sU2 - sU1 * cU2 * cl)
        cos_sigma = sU1 * sU2 + cU1 * cU2 * cl
        sigma = math.atan2(sin_sigma, cos_sigma)
        sin_alpha = cU1 * cU2 * sl / sin_sigma
        cos2_alpha = 1 - sin_alpha ** 2
        cos2sm = cos_sigma - 2 * sU1 * sU2 / cos2_alpha if cos2_alpha else 0.0
        C = F / 16 * cos2_alpha * (4 + F * (4 - 3 * cos2_alpha))
        lam_new = L + (1 - C) * F * sin_alpha * (
            sigma + C * sin_sigma * (cos2sm + C * cos_sigma * (-1 + 2 * cos2sm ** 2)))
        if abs(lam_new - lam) < tol:
            lam = lam_new
            break
        lam = lam_new
    u2 = cos2_alpha * (A ** 2 - B ** 2) / B ** 2
    k1 = (math.sqrt(1 + u2) - 1) / (math.sqrt(1 + u2) + 1)
    Aa = (1 + k1 ** 2 / 4) / (1 - k1)
    Bb = k1 * (1 - 3 * k1 ** 2 / 8)
    dsigma = Bb * sin_sigma * (cos2sm + Bb / 4 * (cos_sigma * (-1 + 2 * cos2sm ** 2)
             - Bb / 6 * cos2sm * (-3 + 4 * sin_sigma ** 2) * (-3 + 4 * cos2sm ** 2)))
    return B * Aa * (sigma - dsigma)


def web_mercator(lat, lon):
    """EPSG:4326 (lat, lon) -> EPSG:3857 (x, y) metres."""
    x = A * math.radians(lon)
    y = A * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
    return x, y


def utm(lat, lon, zone=None, north=True):
    """WGS 84 geographic (lat, lon) -> UTM (easting, northing); Krueger n-series, Karney (2011)."""
    if zone is None:
        zone = int((lon + 180) // 6) + 1
    lon0 = 6 * zone - 183
    k0, E0 = 0.9996, 500000.0
    N0 = 0.0 if north else 10000000.0
    n = F / (2 - F)
    Ahat = A / (1 + n) * (1 + n**2 / 4 + n**4 / 64 + n**6 / 256)
    al = [None,
          n/2 - 2*n**2/3 + 5*n**3/16 + 41*n**4/180 - 127*n**5/288 + 7891*n**6/37800,
          13*n**2/48 - 3*n**3/5 + 557*n**4/1440 + 281*n**5/630 - 1983433*n**6/1935360,
          61*n**3/240 - 103*n**4/140 + 15061*n**5/26880 + 167603*n**6/181440,
          49561*n**4/161280 - 179*n**5/168 + 6601661*n**6/7257600,
          34729*n**5/80640 - 3418889*n**6/1995840,
          212378941*n**6/319334400]
    phi = math.radians(lat)
    lam = math.radians(lon - lon0)
    c = 2 * math.sqrt(n) / (1 + n)
    t = math.sinh(math.atanh(math.sin(phi)) - c * math.atanh(c * math.sin(phi)))
    xi_p = math.atan2(t, math.cos(lam))
    eta_p = math.atanh(math.sin(lam) / math.sqrt(1 + t * t))
    xi = xi_p + sum(al[j] * math.sin(2*j*xi_p) * math.cosh(2*j*eta_p) for j in range(1, 7))
    eta = eta_p + sum(al[j] * math.cos(2*j*xi_p) * math.sinh(2*j*eta_p) for j in range(1, 7))
    return E0 + k0 * Ahat * eta, N0 + k0 * Ahat * xi


def shoelace(coords):
    """Signed area of a ring (counter-clockwise positive). Ring may be open or closed."""
    pts = list(coords)
    if pts[0] != pts[-1]:
        pts.append(pts[0])
    s = 0.0
    for (x1, y1), (x2, y2) in zip(pts[:-1], pts[1:]):
        s += x1 * y2 - x2 * y1
    return s / 2.0


def graticule_cell_area(lat1, lat2, dlon_deg):
    """Exact area (m2) of an ellipsoidal lat/lon quadrilateral on WGS 84 (authalic formula)."""
    e = math.sqrt(E2)
    def q(phi_deg):
        s = math.sin(math.radians(phi_deg))
        return (1 - E2) * (s / (1 - E2 * s * s) - (1 / (2 * e)) * math.log((1 - e * s) / (1 + e * s)))
    return A ** 2 / 2 * math.radians(dlon_deg) * (q(lat2) - q(lat1))
