// Give class boundaries one consistent meaning
// Write class_index(value, edges) to return a zero-based colour-class index. For edges [0,10,20], class 0 is [0,10] and class 1 is (10,20]. Thus each internal boundary belongs to the lower class. Return −1 for values outside the range or non-finite values. Edges are finite and strictly increasing with at least two entries.
// Run: go run cartography.go
// Standard library only. Edit the function; keep and extend the checks below.
package main

import (
	"encoding/json"
	"fmt"
	"math"
	"reflect"
)

func classIndex(value float64, edges []float64) int {
	if math.IsNaN(value) || math.IsInf(value,0) || value < edges[0] || value > edges[len(edges)-1] { return -1 }
	for i, upper := range edges[1:] { if value <= upper { return i } }
	return -1
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
	edges := []float64{0,10,20}
	for i, value := range []float64{0,10,10.001,20,-1,21} { check(classIndex(value,edges), []int{0,0,1,1,-1,-1}[i]) }
	check(classIndex(math.NaN(),edges), -1)
	check(classIndex(math.Inf(1),edges), -1)
	fmt.Println("All checks passed")
}
