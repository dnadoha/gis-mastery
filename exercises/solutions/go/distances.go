// Measure home-to-school distance
// Write distance(a, b) for two [x, y] points in our local metre grid. Return their straight-line distance using sqrt((bx−ax)² + (by−ay)²). This measures a straight line, not a route along roads. Assume finite coordinates; do not pass longitude/latitude to this function.
// Run: go run distances.go
// Standard library only. Edit the function; keep and extend the checks below.
package main

import (
	"encoding/json"
	"fmt"
	"math"
	"reflect"
)

func distance(a, b []float64) float64 {
	return math.Hypot(b[0]-a[0], b[1]-a[1])
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
	check(distance([]float64{260,280},[]float64{200,200}), 100.0)
	check(distance([]float64{200,200},[]float64{260,280}), 100.0)
	check(distance([]float64{0,0},[]float64{3000,4000}), 5000.0)
	check(distance([]float64{-1,-1},[]float64{-1,-1}), 0.0)
	check(distance([]float64{0,0},[]float64{1,1}), math.Sqrt(2))
	fmt.Println("All checks passed")
}
