// Coarsen population cells without losing people
// Write block_sum(grid) to combine each non-overlapping 2 × 2 block into one coarse cell. Values are people per cell, so sum the four values. Input is a nonempty rectangular grid with positive even dimensions and no missing values. Return a new grid with half as many rows and columns; preserve the original.
// Run: go run resampling.go
// Standard library only. Edit the function; keep and extend the checks below.
package main

import (
	"encoding/json"
	"fmt"
	"math"
	"reflect"
)

func blockSum(grid [][]float64) [][]float64 {
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
	check(blockSum([][]float64{{1,2},{3,4}}), [][]float64{{10}})
	grid := [][]float64{{10,10,10,10,10,10},{10,10,10,10,10,10},{10,10,10,10,10,10},{10,10,10,10,10,10}}
	check(blockSum(grid), [][]float64{{40,40,40},{40,40,40}})
	total := 0.0
	for _, row := range blockSum(grid) { for _, value := range row { total += value } }
	check(total, 240.0)
	check(grid[0], []float64{10,10,10,10,10,10})
	check(blockSum([][]float64{{0,2,4,6},{1,3,5,7}}), [][]float64{{6,22}})
	fmt.Println("All checks passed")
}
