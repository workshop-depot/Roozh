package roozh

import (
	"fmt"
)

type PersianMonth int32

const (
	Farvardin PersianMonth = 1 + iota
	Ordibehesht
	Khordad
	Tir
	Mordad
	Shahrivar
	Mehr
	Aban
	Azar
	Dey
	Bahman
	Esfand
)

var persianNames map[PersianMonth]string = map[PersianMonth]string{
	Farvardin:   "Farvardin",
	Ordibehesht: "Ordibehesht",
	Khordad:     "Khordad",
	Tir:         "Tir",
	Mordad:      "Mordad",
	Shahrivar:   "Shahrivar",
	Mehr:        "Mehr",
	Aban:        "Aban",
	Azar:        "Azar",
	Dey:         "Dey",
	Bahman:      "Bahman",
	Esfand:      "Esfand",
}

func (m PersianMonth) String() string {
	return persianNames[m]
}

type Roozh struct {
	Year, Month, Day int32
}

func (r Roozh) String() string {
	return fmt.Sprintf("%04d-%02d-%02d", r.Year, r.Month, r.Day)
}

func PersianToGregorian(year, month, day int32) Roozh {
	jd := _Jal2JD(year, month, day)
	L, M, N := _JD2JG(jd, 0)

	return Roozh{Year: L, Month: M, Day: N}
}

func GregorianToPersian(year, month, day int32) Roozh {
	jd := _JG2JD(year, month, day, 0)
	L, M, N := _JD2Jal(jd)

	return Roozh{Year: L, Month: M, Day: N}
}

func _JD2Jal(JDN int32) (Jy, Jm, Jd int32) {
	//Converts the Julian Day number to a date in the Jalaali calendar
	//Input: JDN - the Julian Day number
	//Output: Jy - Jalaali year (1 to 3100)
	//        Jm - month (1 to 12)
	//        Jd - day (1 to 29/31)

	//Calculate Gregorian year (L)
	L, _, _ := _JD2JG(JDN, 0)
	Jy = L - 621
	leap, _, March := _JalCal(Jy)
	JDN1F := _JG2JD(L, 3, March, 0)
	//Find number of days that passed since 1 Farvardin
	k := JDN - JDN1F
	if k >= 0 {
		if k <= 185 {
			//The first 6 months
			Jm = 1 + k/31
			Jd = _Mod(k, 31) + 1
			return
		} else {
			//The remaining months
			k = k - 186
		}
	} else {
		//previous Jalaali year
		Jy = Jy - 1
		k = k + 179
		if leap == 1 {
			k = k + 1
		}
	}
	Jm = 7 + k/30
	Jd = _Mod(k, 30) + 1

	return
}

func _JD2JG(JD, J1G0 int32) (L, M, N int32) {
	//Input:  JD   - Julian Day number
	//        J1G0 - to be set to 1 for Julian and to 0 for Gregorian calendar
	//Output: L - calendar year (years BC numbered 0, -1, -2, ...)
	//        M - calendar month (for January M=1, February M=2, ... M=12)
	//        N - calendar day of the month M (1 to 28/29/30/31)
	// Calculates Gregorian and Julian calendar dates from the Julian Day number
	// (JD) for the period since JD=-34839655 (i.e. the year -100100 of both
	// the calendars) to some millions (10**6) years ahead of the present.
	// The algorithm is based on D.A. Hatcher, Q.Jl.R.Astron.Soc. 25(1984), 53-55
	// slightly modified by me (K.M. Borkowski, Post.Astron. 25(1987), 275-279).
	var I, J int32
	J = 4*JD + 139361631
	if J1G0 <= 0 {
		J = J + (4*JD+183187720)/146097*3/4*4 - 3908
	}
	I = _Mod(J, 1461)/4*5 + 308
	N = _Mod(I, 153)/5 + 1
	M = _Mod(I/153, 12) + 1
	L = J/1461 - 100100 + (8-M)/6

	return
}

func _Jal2JD(Jy, Jm, Jd int32) int32 {
	//Converts a date of the Jalaali calendar to the Julian Day Number
	//Input:  Jy - Jalaali year (1 to 3100)
	//        Jm - month (1 to 12)
	//        Jd - day (1 to 29/31)
	//Output: Jal2JD - the Julian Day Number
	_, iGy, March := _JalCal(Jy)
	return _JG2JD(iGy, 3, March, 0) + (Jm-1)*31 - Jm/7*(Jm-7) + Jd - 1
}

func _JG2JD(L, M, N, J1G0 int32) (res int32) {
	//Input:  L - calendar year (years BC numbered 0, -1, -2, ...)
	//        M - calendar month (for January M=1, February M=2, ..., M=12)
	//        N - calendar day of the month M (1 to 28/29/30/31)
	//     J1G0 - to be set to 1 for Julian and to 0 for Gregorian calendar
	//Output: JG2JD - Julian Day number
	// Calculates the Julian Day number (JG2JD) from Gregorian or Julian
	// calendar dates. This integer number corresponds to the noon of
	// the date (i.e. 12 hours of Universal Time).
	// The procedure was tested to be good since 1 March, -100100 (of both
	// the calendars) up to a few millions (10**6) years into the future.
	// The algorithm is based on D.A. Hatcher, Q.Jl.R.Astron.Soc. 25(1984), 53-55
	// slightly modified by me (K.M. Borkowski, Post.Astron. 25(1987), 275-279).

	res = (L+(M-8)/6+100100)*1461/4 + (153*_Mod(M+9, 12)+2)/5 + N - 34840408
	if J1G0 <= 0 {
		res = res - (L+100100+(M-8)/6)/100*3/4 + 752
	}
	//MJD=JG2JD-2400000.5   ! this formula gives Modified Julian Day number
	return
}

func _JalCal(Jy int32) (leap, Gy, March int32) {
	leap = 0
	Gy = 0
	March = 0
	//This procedure determines if the Jalaali (Persian) year is
	//leap (366-day long) or is the common year (365 days), and
	//finds the day in March (Gregorian calendar) of the first
	//day of the Jalaali year (Jy)
	//Input:  Jy - Jalaali calendar year (-61 to 3177)
	//Output:
	//  leap  - number of years since the last leap year (0 to 4)
	//  Gy    - Gregorian year of the beginning of Jalaali year
	//  March - the March day of Farvardin the 1st (1st day of Jy)
	//Jalaali years starting the 33-year rule
	breaks := []int32{-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178}
	Gy = Jy + 621
	leapJ := int32(-14)
	jp := breaks[0]
	if Jy < jp || Jy > breaks[19] {
		//      print'(10x,a,i5,a,i5,a)',
		//*' Invalid Jalaali year number:',Jy,' (=',Gy,' Gregorian)'
	}
	//Find the limiting years for the Jalaali year Jy
	jump := int32(0)
	for j := int32(1); j <= 19; j++ {
		jm := breaks[j]
		jump = jm - jp
		if Jy < jm {
			goto Label2
		}
		//Q:should these 2 lines be in the for loop?
		leapJ = leapJ + jump/33*8 + _Mod(jump, 33)/4
		//Label1:
		jp = jm
	}
Label2:
	N := int32(Jy - jp)
	//Find the number of leap years from AD 621 to the beginning
	//of the current Jalaali year in the Persian calendar
	leapJ = leapJ + N/33*8 + (_Mod(N, 33)+3)/4
	if _Mod(jump, 33) == 4 && (jump-N) == 4 {
		leapJ = leapJ + 1
	}
	//and the same in the Gregorian calendar (until the year Gy)
	leapG := int32(Gy/4 - (Gy/100+1)*3/4 - 150)
	//Determine the Gregorian date of Farvardin the 1st
	March = 20 + leapJ - leapG
	//Find how many years have passed since the last leap year
	if (jump - N) < 6 {
		N = N - jump + (jump+4)/33*33
	}
	leap = _Mod(_Mod(N+1, 33)-1, 4)
	if leap == -1 {
		leap = 4
	}

	return
}

func _Mod(a, b int32) int32 {
	return a % b
}

/*

*/

/*

















    }
}
*/
