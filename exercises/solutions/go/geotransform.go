// Locate a raster cell’s centre
// Given zero-based col and row plus six GDAL geotransform values gt, return the cell centre [x,y]. Use x = gt[0] + (col+0.5)gt[1] + (row+0.5)gt[2] and y = gt[3] + (col+0.5)gt[4] + (row+0.5)gt[5]. The transform describes cell corners; the half-cell offsets reach the centre. Assume nonnegative indices and exactly six coefficients.
// Run: go run geotransform.go
// Standard library only. Edit the function; keep and extend the checks below.
package main

import (
	"encoding/json"
	"fmt"
	"math"
	"reflect"
)

func cellCentre(col, row int, gt []float64) []float64 {
	c, r := float64(col)+0.5, float64(row)+0.5
	return []float64{gt[0]+c*gt[1]+r*gt[2], gt[3]+c*gt[4]+r*gt[5]}
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
	gt := []float64{0,100,0,400,0,-100}
	check(cellCentre(0,0,gt), []float64{50,350})
	check(cellCentre(5,3,gt), []float64{550,50})
	check(cellCentre(0,0,[]float64{10,2,1,20,0.5,-2}), []float64{11.5,19.25})
	check(cellCentre(2,1,[]float64{10,2,1,20,0.5,-2}), []float64{16.5,18.25})
	fmt.Println("All checks passed")
}
