// Resolve swapped coordinate fields
// An area of interest (AOI) is the region where a point is expected. Given first, second and an AOI [west, south, east, north], test both possible longitude/latitude orders. Return [longitude, latitude] only when exactly one interpretation lies inside the inclusive AOI. Return None/nil when both or neither fit. Inputs are finite numbers and the AOI does not cross the antimeridian.
// Run: go run axes.go
// Standard library only. Edit the function; keep and extend the checks below.
package main

import (
	"encoding/json"
	"fmt"
	"math"
	"reflect"
)

func resolveAxes(first, second float64, aoi []float64) []float64 {
	west, south, east, north := aoi[0], aoi[1], aoi[2], aoi[3]
	var valid [][]float64

	isValid := false
	for _, point := range [][]float64{{first, second}, {second, first}} {
		isValid = point[0] >= west && point[0] <= east && point[1] >= south && point[1] <= north
		if isValid {
			valid = append(valid, point)
		}
	}

	if len(valid) == 1 {
		return valid[0]
	}

	return nil
}

// Comparison helpers used by the runnable checks.
func equivalent(got, want any) bool {
	a, b := reflect.ValueOf(got), reflect.ValueOf(want)
	if !a.IsValid() || !b.IsValid() {
		return !a.IsValid() && !b.IsValid()
	}
	if a.Type() != b.Type() {
		return false
	}
	if a.Kind() == reflect.Float64 {
		x, y := a.Float(), b.Float()
		return !math.IsNaN(x) && !math.IsInf(x, 0) && math.Abs(x-y) <= math.Max(1e-6, 1e-9*math.Max(math.Abs(x), math.Abs(y)))
	}
	if a.Kind() == reflect.Slice {
		if a.Len() != b.Len() {
			return false
		}
		for i := 0; i < a.Len(); i++ {
			if !equivalent(a.Index(i).Interface(), b.Index(i).Interface()) {
				return false
			}
		}
		return true
	}
	return reflect.DeepEqual(got, want)
}
func check(got, want any) {
	if !equivalent(got, want) {
		panic(fmt.Sprintf("got %#v; expected %#v", got, want))
	}
}
func decode(text string) any {
	var value any
	if err := json.Unmarshal([]byte(text), &value); err != nil {
		panic(err)
	}
	return value
}

func main() {
	aoi := []float64{3, 50, 8, 54}
	check(resolveAxes(4.9003, 52.3791, aoi), []float64{4.9003, 52.3791})
	check(resolveAxes(52.3791, 4.9003, aoi), []float64{4.9003, 52.3791})
	check(resolveAxes(10, 20, []float64{0, 0, 60, 60}), []float64(nil))
	check(resolveAxes(100, 100, aoi), []float64(nil))
	check(resolveAxes(5, 5, []float64{0, 0, 10, 10}), []float64(nil))
	check(resolveAxes(3, 50, aoi), []float64{3, 50})
	fmt.Println("All checks passed")
}
