// Choose a UTM zone, including the exceptions
// Return the WGS 84 UTM zone number for finite longitude/latitude values. Use floor((lon + 180) / 6) + 1, with +180° assigned to zone 60. Accept −180 ≤ lon ≤ 180 and −80 ≤ lat < 84; return 0 outside this contract. Norway: 56 ≤ lat < 64 and 3 ≤ lon < 12 uses zone 32. Svalbard: 72 ≤ lat < 84 uses zones 31, 33, 35, 37 for longitude intervals [0,9), [9,21), [21,33), [33,42), respectively.
// Run: go run projections.go
// Standard library only. Edit the function; keep and extend the checks below.
package main

import (
	"encoding/json"
	"fmt"
	"math"
	"reflect"
)

func utmZone(lon, lat float64) int {
	if !(lon >= -180 && lon <= 180 && lat >= -80 && lat < 84) { return 0 }
	if lat >= 56 && lat < 64 && lon >= 3 && lon < 12 { return 32 }
	if lat >= 72 && lat < 84 && lon >= 0 && lon < 42 {
		for i, east := range []float64{9,21,33,42} { if lon < east { return 31 + 2*i } }
	}
	return int(math.Min(60, math.Floor((lon+180)/6)+1))
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
	check(utmZone(90.4125,23.8103), 46)
	check(utmZone(4.9003,52.3791), 31)
	check(utmZone(180,0), 60)
	check(utmZone(-180,0), 1)
	check(utmZone(3,56), 32)
	check(utmZone(3,64), 31)
	for i, lon := range []float64{0,9,21,33,42} { check(utmZone(lon,75), []int{31,33,35,37,38}[i]) }
	check(utmZone(0,84), 0)
	check(utmZone(181,0), 0)
	check(utmZone(0,-80), 31)
	fmt.Println("All checks passed")
}
