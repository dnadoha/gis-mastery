// Budget raster memory before allocating it
// Write raster_bytes(width, height, bands, bytes_per_sample) to calculate uncompressed pixel storage. Dimensions are nonnegative integers; bands and bytes_per_sample must be positive integers. Return −1 for invalid inputs. A zero width or height is an empty raster and uses zero pixel bytes. Ignore headers, compression, masks and overview images. Go inputs and products fit into int64.
// Run: go run vector_raster.go
// Standard library only. Edit the function; keep and extend the checks below.
package main

import (
	"encoding/json"
	"fmt"
	"math"
	"reflect"
)

func rasterBytes(width, height, bands, bytesPerSample int64) int64 {
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
	check(rasterBytes(1000,1000,3,2), int64(6000000))
	check(rasterBytes(2000,2000,3,2), int64(24000000))
	check(rasterBytes(6,4,1,4), int64(96))
	check(rasterBytes(0,4,1,4), int64(0))
	check(rasterBytes(-1,4,1,4), int64(-1))
	check(rasterBytes(4,4,0,4), int64(-1))
	check(rasterBytes(4,4,1,0), int64(-1))
	fmt.Println("All checks passed")
}
