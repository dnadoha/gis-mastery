// Convert GPS height to geoid-referenced height
// GPS gives ellipsoidal height h. Geoid undulation N is the signed height of the geoid above the ellipsoid. Implement orthometric_height(h, n) using H = h − N. All values are metres. Use a supplied N; this exercise does not estimate a geoid model.
// Run: go run earth.go
// Standard library only. Edit the function; keep and extend the checks below.
package main

import (
	"encoding/json"
	"fmt"
	"math"
	"reflect"
)

func orthometricHeight(h, n float64) float64 {
	return h - n
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
	check(orthometricHeight(50,20), 30.0)
	check(orthometricHeight(50,-20), 70.0)
	check(orthometricHeight(7.25,0.5), 6.75)
	check(orthometricHeight(10,30), -20.0)
	check(orthometricHeight(0,0), 0.0)
	fmt.Println("All checks passed")
}
