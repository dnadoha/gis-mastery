// Implement signed polygon area
// Implement signed_area(ring) with the shoelace formula: half the sum of xᵢyᵢ₊₁ − xᵢ₊₁yᵢ, including the last-to-first edge. Return zero for fewer than three points. A repeated closing point is allowed. Counterclockwise rings have positive area. Coordinates are local metres. This calculates algebraic area; it does not validate self-crossing rings.
// Run: go run algorithms.go
// Standard library only. Edit the function; keep and extend the checks below.
package main

import (
	"encoding/json"
	"fmt"
	"math"
	"reflect"
)

func signedArea(ring [][]float64) float64 {
	if len(ring) < 3 { return 0 }
	ox, oy := ring[0][0], ring[0][1]
	total := 0.0
	for i, p := range ring {
		q := ring[(i+1)%len(ring)]
		total += (p[0]-ox)*(q[1]-oy) - (q[0]-ox)*(p[1]-oy)
	}
	return total / 2
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
	ring := [][]float64{{0,0},{4,0},{4,3},{0,3}}
	check(signedArea(ring), 12.0)
	check(signedArea([][]float64{{0,3},{4,3},{4,0},{0,0}}), -12.0)
	check(signedArea(append(ring,ring[0])), 12.0)
	shifted := make([][]float64,len(ring))
	for i,p := range ring { shifted[i] = []float64{p[0]+1e9,p[1]+1e9} }
	check(signedArea(shifted), 12.0)
	check(signedArea(nil), 0.0)
	check(signedArea([][]float64{{0,0},{1,1}}), 0.0)
	check(signedArea([][]float64{{0,0},{2,2},{2,0},{0,2}}), 0.0)
	fmt.Println("All checks passed")
}
