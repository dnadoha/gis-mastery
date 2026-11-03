// Transform a local drawing’s coordinates
// Implement a two-dimensional similarity transform: rotate a point anticlockwise by angle_deg, multiply both axes by scale, then add dx and dy. Return the new [x, y]. Use x′ = scale × (x cos θ − y sin θ) + dx and y′ = scale × (x sin θ + y cos θ) + dy. This is a local drawing exercise, not a geodetic datum transformation. Inputs are finite.
// Run: go run transformations.go
// Standard library only. Edit the function; keep and extend the checks below.
package main

import (
	"encoding/json"
	"fmt"
	"math"
	"reflect"
)

func transformPoint(point []float64, angleDeg, scale, dx, dy float64) []float64 {
	x, y := point[0], point[1]
	theta := angleDeg * math.Pi / 180
	c, s := math.Cos(theta), math.Sin(theta)
	return []float64{scale*(x*c-y*s)+dx, scale*(x*s+y*c)+dy}
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
	check(transformPoint([]float64{200,200},0,1,0,0), []float64{200,200})
	check(transformPoint([]float64{1,0},90,1,0,0), []float64{0,1})
	check(transformPoint([]float64{1,2},90,2,100,200), []float64{96,202})
	check(transformPoint([]float64{0,1},-90,1,0,0), []float64{1,0})
	p := []float64{1,2}
	transformPoint(p,45,3,10,20)
	check(p, []float64{1,2})
	fmt.Println("All checks passed")
}
