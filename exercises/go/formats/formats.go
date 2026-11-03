// Serialize School A as GeoJSON
// Return a JSON string containing a GeoJSON Feature with properties {"name": name} and a Point geometry whose coordinates are [lon, lat]. Inputs are a string and valid finite WGS 84 longitude/latitude. Use the standard JSON encoder so quotes and Unicode names round-trip correctly. Do not add a legacy "crs" member.
// Run: go run formats.go
// Standard library only. Edit the function; keep and extend the checks below.
package main

import (
	"encoding/json"
	"fmt"
	"math"
	"reflect"
)

func schoolGeoJSON(name string, lon, lat float64) string {
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
	for _, name := range []string{"School A", "School \"A\"", "বিদ্যালয়", "line\nbreak"} {
		feature := decode(schoolGeoJSON(name,90.4125,23.8103)).(map[string]any)
		check(feature["type"], "Feature")
		check(feature["properties"].(map[string]any)["name"], name)
		check(feature["geometry"], decode("{\"type\":\"Point\",\"coordinates\":[90.4125,23.8103]}"))
		check(len(feature), 3)
	}
	check(decode(schoolGeoJSON("Zero",0,0)).(map[string]any)["geometry"], decode("{\"type\":\"Point\",\"coordinates\":[0,0]}"))
	fmt.Println("All checks passed")
}
