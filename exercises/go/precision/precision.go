// Compare positions using a distance tolerance
// Implement within_tolerance(a, b, tolerance) for local metre coordinates. Return true when the Euclidean separation is at most tolerance. Return false for a negative tolerance. Assume finite inputs. The tolerance is a rule for comparison, not a claim about the survey’s accuracy.
// Run: go run precision.go
// Standard library only. Edit the function; keep and extend the checks below.
package main

import (
	"encoding/json"
	"fmt"
	"math"
	"reflect"
)

func withinTolerance(a, b []float64, tolerance float64) bool {
	// TODO: implement the contract above.
	panic("Implement this function")
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
	check(withinTolerance([]float64{0,0},[]float64{0.6,0.8},1), true)
	check(withinTolerance([]float64{0,0},[]float64{0.8,0.8},1), false)
	check(withinTolerance([]float64{0,0},[]float64{1.001,0},1), false)
	check(withinTolerance([]float64{200,200},[]float64{200,200},0), true)
	check(withinTolerance([]float64{0,0},[]float64{0,0},-1), false)
	fmt.Println("All checks passed")
}
