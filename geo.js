/* Small, dependency-free calculations for the teaching visuals. */
const Geo = {
  radians(degrees) { return degrees * Math.PI / 180; },
  degreeLengths(latitude) {
    const a = 6378137, f = 1 / 298.257223563, e2 = f * (2 - f);
    const p = this.radians(latitude), q = 1 - e2 * Math.sin(p) ** 2;
    return { lat: Math.PI / 180 * a * (1 - e2) / q ** 1.5, lon: Math.PI / 180 * a / Math.sqrt(q) * Math.cos(p) };
  },
  mercatorScale(latitude) { return 1 / Math.cos(this.radians(latitude)); },
  utm(latitude, longitude, zone = 31) {
    // Sixth-order Krüger series, matching Appendix A (WGS 84).
    const f = 1 / 298.257223563, n = f / (2 - f);
    const ah = 6378137 / (1 + n) * (1 + n ** 2 / 4 + n ** 4 / 64 + n ** 6 / 256);
    const alpha = [0,
      n/2 - 2*n**2/3 + 5*n**3/16 + 41*n**4/180 - 127*n**5/288 + 7891*n**6/37800,
      13*n**2/48 - 3*n**3/5 + 557*n**4/1440 + 281*n**5/630 - 1983433*n**6/1935360,
      61*n**3/240 - 103*n**4/140 + 15061*n**5/26880 + 167603*n**6/181440,
      49561*n**4/161280 - 179*n**5/168 + 6601661*n**6/7257600,
      34729*n**5/80640 - 3418889*n**6/1995840,
      212378941*n**6/319334400];
    const p = this.radians(latitude), l = this.radians(longitude - (6 * zone - 183));
    const c = 2 * Math.sqrt(n) / (1 + n);
    const t = Math.sinh(Math.atanh(Math.sin(p)) - c * Math.atanh(c * Math.sin(p)));
    const xi0 = Math.atan2(t, Math.cos(l)), eta0 = Math.atanh(Math.sin(l) / Math.sqrt(1 + t * t));
    let xi = xi0, eta = eta0;
    for (let j = 1; j <= 6; j++) {
      xi += alpha[j] * Math.sin(2*j*xi0) * Math.cosh(2*j*eta0);
      eta += alpha[j] * Math.cos(2*j*xi0) * Math.sinh(2*j*eta0);
    }
    return [500000 + .9996 * ah * eta, (latitude < 0 ? 10000000 : 0) + .9996 * ah * xi];
  },
  area(ring) {
    // Shift origin to reduce cancellation with large projected coordinates.
    if (ring.length < 3) return 0;
    const [ox, oy] = ring[0];
    return ring.reduce((sum, p, i) => {
      const q = ring[(i + 1) % ring.length];
      return sum + (p[0]-ox)*(q[1]-oy) - (q[0]-ox)*(p[1]-oy);
    }, 0) / 2;
  },
  circle(centre, radius, vertices = 64) {
    return Array.from({ length: vertices }, (_, i) => [centre[0] + radius * Math.cos(2*Math.PI*i/vertices), centre[1] + radius * Math.sin(2*Math.PI*i/vertices)]);
  },
  pointInRing(point, ring) {
    const [x, y] = point;
    let inside = false;
    for (let i = 0; i < ring.length; i++) {
      const [x1, y1] = ring[i], [x2, y2] = ring[(i + 1) % ring.length];
      if ((y1 > y) !== (y2 > y) && x1 + (y-y1)*(x2-x1)/(y2-y1) > x) inside = !inside;
    }
    return inside;
  },
  cellCentre(col, row) { return [570000 + (col + .5) * 2000, 5820000 - (row + .5) * 2000]; },
  bilinear(u, v) { return (1-u)*(1-v)*10 + u*(1-v)*20 + (1-u)*v*30 + u*v*40; },
  classify(value, edges) {
    const index = edges.slice(1, -1).findIndex(edge => value <= edge);
    return index < 0 ? edges.length - 2 : index;
  },
  breaks(values, k, method) {
    const d = [...values].sort((a, b) => a - b), n = d.length;
    if (!n || k < 1 || k > new Set(d).size) throw new Error('Classes must fit the number of distinct values.');
    if (method === 'equal') return Array.from({length: k+1}, (_, i) => d[0] + i * (d[n-1]-d[0]) / k);
    if (method === 'quantile') return Array.from({length: k+1}, (_, i) => {
      const rank = (n-1)*i/k, lo = Math.floor(rank), hi = Math.ceil(rank);
      return d[lo] + (d[hi]-d[lo])*(rank-lo);
    });
    const sums = [0], squares = [0];
    d.forEach(v => { sums.push(sums.at(-1) + v); squares.push(squares.at(-1) + v*v); });
    const best = Array.from({length: k+1}, () => Array(n+1).fill(Infinity));
    const back = Array.from({length: k+1}, () => Array(n+1).fill(0));
    best[0][0] = 0;
    for (let c = 1; c <= k; c++) for (let j = c; j <= n; j++) for (let i = c-1; i < j; i++) {
      const ssd = squares[j]-squares[i] - (sums[j]-sums[i])**2/(j-i);
      const candidate = best[c-1][i] + ssd;
      if (candidate < best[c][j]) { best[c][j] = candidate; back[c][j] = i; }
    }
    const uppers = [];
    let j = n;
    for (let c = k; c > 0; c--) { uppers.unshift(d[j-1]); j = back[c][j]; }
    return [d[0], ...uppers];
  },
  gvf(values, edges) {
    const mean = values.reduce((s,v) => s+v, 0) / values.length;
    const total = values.reduce((s,v) => s+(v-mean)**2, 0);
    if (total === 0) return 1;
    const groups = Array.from({length: edges.length-1}, () => []);
    values.forEach(v => groups[this.classify(v, edges)].push(v));
    const within = groups.reduce((sum, g) => {
      if (!g.length) return sum;
      const m = g.reduce((s,v) => s+v, 0) / g.length;
      return sum + g.reduce((s,v) => s+(v-m)**2, 0);
    }, 0);
    return 1 - within / total;
  },
  stations: [
    { name: 'Amsterdam', lat: 52.3791, lon: 4.9003, amp: 900 },
    { name: 'Utrecht', lat: 52.0894, lon: 5.1103, amp: 600 },
    { name: 'Rotterdam', lat: 51.9244, lon: 4.4690, amp: 800 },
    { name: 'Den Haag', lat: 52.0806, lon: 4.3248, amp: 700 }
  ],
  population() {
    const stations = this.stations.map(s => ({ ...s, xy: this.utm(s.lat, s.lon) }));
    const cells = Array.from({length: 1800}, (_, i) => {
      const col = i % 45, row = Math.floor(i / 45), xy = this.cellCentre(col, row);
      const value = 20 + stations.reduce((sum, s) => sum + s.amp * Math.exp(-((xy[0]-s.xy[0])**2 + (xy[1]-s.xy[1])**2) / (2*8000**2)), 0);
      // No half-integer ties occur in this fixed dataset (numpy.rint agrees).
      return { col, row, xy, value: Math.round(value) };
    });
    return { stations, cells };
  },
  coverage(data, radius) {
    const rings = data.stations.map(s => this.circle(s.xy, radius));
    const totals = data.stations.map(() => ({cells: 0, people: 0}));
    let people = 0, cells = 0, excess = 0;
    const counts = [0, 0, 0, 0, 0];
    const memberships = data.cells.map(cell => {
      let count = 0;
      rings.forEach((ring, i) => {
        if (this.pointInRing(cell.xy, ring)) { count++; totals[i].cells++; totals[i].people += cell.value; }
      });
      counts[count]++;
      if (count) { cells++; people += cell.value; excess += cell.value * (count-1); }
      return count;
    });
    return { rings, totals, people, cells, excess, counts, memberships };
  }
};
