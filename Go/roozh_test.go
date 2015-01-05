package roozh

import (
	"fmt"
	"testing"
)

func TestDummy(t *testing.T) {
	pm := Farvardin
	fmt.Println(pm)

	var y, m, d int32
	y, m, d = 1393, 10, 16

	r := Roozh{Year: y, Month: m, Day: d}
	fmt.Println(r)

	r = PersianToGregorian(y, m, d)
	fmt.Println(r)

	y, m, d = r.Year, r.Month, r.Day

	r = GregorianToPersian(y, m, d)
	fmt.Println(r)
}
