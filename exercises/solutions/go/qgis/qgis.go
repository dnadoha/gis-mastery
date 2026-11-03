// Prepare density attributes for QGIS
// Prepare a table that can be exported as CSV for QGIS. Each input cell is [x,y,people] in the local metre grid. Return rows [x,y,people,people_per_km2], using one positive cell_area_m2 for all cells. A square kilometre is 1,000,000 m². Do not mutate inputs; empty input returns an empty list. These local drawing coordinates have no EPSG label: use the documented real CRS when exporting real projected data.
// Run: go run qgis.go
// Standard library only. Edit the function; keep and extend the checks below.
package main

import (
	"encoding/json"
	"fmt"
	"math"
	"reflect"
)

func densityRows(cells [][]float64, cellAreaM2 float64) [][]float64 {
	rows := make([][]float64,0,len(cells))
	for _, c := range cells { rows = append(rows,[]float64{c[0],c[1],c[2],c[2]*1000000/cellAreaM2}) }
	return rows
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
	cells := [][]float64{{50,350,10},{150,350,0}}
	check(densityRows(cells,10000), [][]float64{{50,350,10,1000},{150,350,0,0}})
	check(densityRows([][]float64{{0,0,10}},40000), [][]float64{{0,0,10,250}})
	check(densityRows([][]float64{{0,0,3}},2000000), [][]float64{{0,0,3,1.5}})
	check(densityRows(nil,10000), [][]float64{})
	check(cells, [][]float64{{50,350,10},{150,350,0}})
	fmt.Println("All checks passed")
}
