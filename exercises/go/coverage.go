// Count people near either school exactly once
// Each cell is [centreX, centreY, people]. Schools are [x,y] points. Write covered_population(cells, schools, radius) to sum a cell’s people if its centre is within radius metres of at least one school. Include centres exactly on the radius. Inputs use local metres, nonnegative finite populations and a nonnegative finite radius. Empty inputs return zero.
// Run: go run coverage.go
// Standard library only. Edit the function; keep and extend the checks below.
package main

import (
	"encoding/json"
	"fmt"
	"math"
	"reflect"
)

func coveredPopulation(cells, schools [][]float64, radius float64) float64 {
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
	var cells [][]float64
	for r := 0; r < 4; r++ { for c := 0; c < 6; c++ { cells = append(cells,[]float64{float64(c*100+50),float64(350-r*100),10}) } }
	schools := [][]float64{{200,200},{400,200}}
	check(coveredPopulation(cells,schools,200), 200.0)
	check(coveredPopulation(cells,append(schools,schools...),200), 200.0)
	check(coveredPopulation(cells,schools,1000), 240.0)
	check(coveredPopulation([][]float64{{3,4,7}},[][]float64{{0,0}},5), 7.0)
	check(coveredPopulation([][]float64{{3,4,7}},[][]float64{{0,0}},4.99), 0.0)
	check(coveredPopulation(cells,nil,200), 0.0)
	check(coveredPopulation(nil,schools,200), 0.0)
	check(coveredPopulation([][]float64{{0,0,8}},[][]float64{{0,0}},0), 8.0)
	fmt.Println("All checks passed")
}
