// Guard a metre-based analysis function
// Before measuring school access, your application has three verified metadata fields: kind, unit and suitable. Write measurement_ready to return true only when kind is "projected", unit is "metre", and suitable is true. The suitability flag means someone has checked this CRS’s region and distortion for the task. Unknown strings must fail this deliberately small API contract.
// Run: go run crs.go
// Standard library only. Edit the function; keep and extend the checks below.
package main

import (
	"encoding/json"
	"fmt"
	"math"
	"reflect"
)

func measurementReady(kind, unit string, suitable bool) bool {
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
	check(measurementReady("projected","metre",true), true)
	check(measurementReady("geographic","degree",true), false)
	check(measurementReady("projected","metre",false), false)
	check(measurementReady("projected","foot",true), false)
	check(measurementReady("","",true), false)
	fmt.Println("All checks passed")
}
