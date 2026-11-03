// Audit coordinates before they reach the map
// Write invalid_points(points, aoi) to return the zero-based indices of suspect [lon,lat] points, in input order. Flag non-finite coordinates, longitude outside ±180°, latitude outside ±90°, or coordinates outside the inclusive AOI [west,south,east,north]. Assume pairs have exactly two numbers and the AOI is valid and does not cross the antimeridian. Report problems without silently swapping or repairing data.
// Run: go run debugging.go
// Standard library only. Edit the function; keep and extend the checks below.
package main

import (
	"encoding/json"
	"fmt"
	"math"
	"reflect"
)

func invalidPoints(points [][]float64, aoi []float64) []int {
	bad := []int{}
	for i,p := range points {
		lon, lat := p[0], p[1]
		valid := !math.IsNaN(lon) && !math.IsNaN(lat) && !math.IsInf(lon,0) && !math.IsInf(lat,0) && lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90 && lon >= aoi[0] && lon <= aoi[2] && lat >= aoi[1] && lat <= aoi[3]
		if !valid { bad = append(bad,i) }
	}
	return bad
}

// Comparison helpers used by the runnable checks.
func equivalent(got, want any) bool {
	a, b := reflect.ValueOf(got), reflect.ValueOf(want)
	if !a.IsValid() || !b.IsValid() { return !a.IsValid() && !b.IsValid() }
	if a.Type() != b.Type() { return false }
	if a.Kind() == reflect.Float64 {
		x, y := a.Float(), b.Float()
		return !math.IsNaN(x) && !math.IsInf(x,0) && math.Abs(x-y) <= math.Max(1e-6,1e-9*math.Max(math.Abs(x),math.Abs(y)))
	}
	if a.Kind() == reflect.Slice {
		if a.Len() != b.Len() { return false }
		for i:=0; i<a.Len(); i++ { if !equivalent(a.Index(i).Interface(), b.Index(i).Interface()) { return false } }
		return true
	}
	return reflect.DeepEqual(got,want)
}
func check(got, want any) {
	if !equivalent(got,want) { panic(fmt.Sprintf("got %#v; expected %#v",got,want)) }
}
func decode(text string) any {
	var value any
	if err := json.Unmarshal([]byte(text), &value); err != nil { panic(err) }
	return value
}

func main() {
	aoi := []float64{3,50,8,54}
	points := [][]float64{{4.9003,52.3791},{52.3791,4.9003},{181,52},{4,math.NaN()},{3,50},{8,54}}
	check(invalidPoints(points,aoi), []int{1,2,3})
	check(invalidPoints([][]float64{{math.Inf(1),52},{4,-91}},aoi), []int{0,1})
	check(invalidPoints(nil,aoi), []int{})
	check(invalidPoints([][]float64{{4,52}},aoi), []int{})
	check(points[1], []float64{52.3791,4.9003})
	fmt.Println("All checks passed")
}
