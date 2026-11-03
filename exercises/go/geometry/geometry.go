// Find the neighbourhood’s bounding box
// A bounding box is the smallest axis-aligned rectangle containing all your points. Write bounds(points), returning [minimum x, minimum y, maximum x, maximum y]. Coordinates are local metres. Return None in Python or nil in Go for an empty input. Do not change the input points.
// Run: go run geometry.go
// Standard library only. Edit the function; keep and extend the checks below.
package main

import (
	"encoding/json"
	"fmt"
	"math"
	"reflect"
)

func bounds(points [][]float64) []float64 {
	n := len(points)
	if n == 0 {
		return nil
	}
	minX, minY := points[0][0], points[0][1]
	maxX, maxY := points[n-1][0], points[n-1][1]

	for _, point := range points {
		minX = math.Min(minX, point[0])
		minY = math.Min(minY, point[1])
		maxX = math.Max(maxX, point[0])
		maxY = math.Max(maxY, point[1])
	}

	return []float64{minX, minY, maxX, maxY}
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
	check(bounds([][]float64{{200, 200}, {400, 200}, {260, 280}}), []float64{200, 200, 400, 280})
	check(bounds([][]float64{{5, 7}}), []float64{5, 7, 5, 7})
	check(bounds([][]float64{{-5, -2}, {-1, -8}, {-3, -4}}), []float64{-5, -8, -1, -2})
	check(bounds(nil), []float64(nil))
	points := [][]float64{{4, 8}, {1, 3}}
	bounds(points)
	check(points, [][]float64{{4, 8}, {1, 3}})
	fmt.Println("All checks passed")
}
