// Distinguish a park’s interior, edge and exterior
// Write box_relation(point, box) for an axis-aligned rectangle [minX,minY,maxX,maxY]. Return "inside", "boundary" or "outside". Corners are on the boundary. Assume a positive-width, positive-height box and finite values. Use exact comparisons for these exact teaching coordinates; this does not implement arbitrary polygon predicates.
// Run: go run topology.go
// Standard library only. Edit the function; keep and extend the checks below.
package main

import (
	"encoding/json"
	"fmt"
	"math"
	"reflect"
)

func boxRelation(point, box []float64) string {
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
	box := []float64{0,0,4,3}
	check(boxRelation([]float64{2,1},box), "inside")
	for _, p := range [][]float64{{0,1},{4,1},{2,0},{2,3},{0,0},{4,3}} { check(boxRelation(p,box), "boundary") }
	check(boxRelation([]float64{0,4},box), "outside")
	check(boxRelation([]float64{-0.01,1},box), "outside")
	fmt.Println("All checks passed")
}
