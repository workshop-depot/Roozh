var Roozh = {
    isValidGregorianDate: function (d) {
        var s = Object.prototype.toString.call(d);

        if (s == "[object Date]") {
            if (isNaN(d.getTime())) {
                return false;
            }

            return true;
        } else {
            return false;
        }
    },

    toGregorianDate: function (t) {
        var dt = JSON.stringify(t);
        var d = new Date(t);

        if (this.isValidGregorianDate(d)) return d;

        try {
            d = new Date(Number(dt.match(/\d+/)));
        } catch (exc) { }

        return d;
    },

    pojsoGregorianDate: function (gd) {
        return { year: gd.getFullYear(), month: gd.getMonth() + 1, day: gd.getDate() };
    },

    mod: function (a, b) {
        //if (a < b) return a;

        return a % b;
    },

    int: function (v) {
        //if (v < 0) return Math.floor(v) + 1;

        //return Math.floor(v);
        var res = Math.floor(Math.abs(v));
        if (v < 0) res = res * -1;
        return res;
    },

    __JG2JD__: function (L, M, N, J1G0) {
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

        //var res = (L + (M - 8) / 6 + 100100) * 1461 / 4 + (153 * Mod(M + 9, 12) + 2) / 5 + N - 34840408;
        //if (J1G0 <= 0) res = res - (L + 100100 + (M - 8) / 6) / 100 * 3 / 4 + 752;
        //MJD=JG2JD-2400000.5   ! this formula gives Modified Julian Day number

        var d = this.int;
        var Mod = this.mod;

        var res = d(d((L + d((M - 8) / 6) + 100100) * 1461 / 4) + d((153 * Mod(M + 9, 12) + 2) / 5) + N - 34840408);
        //if (J1G0 <= 0) res = res - d(d((L + 100100 + d((M - 8) / 6)) / 100) * 3 / 4) + 752;
        if (J1G0 <= 0) res = res + 752 - d(d((L + 100100 + d((M - 8) / 6)) / 100) * 3 / 4);

        return res;
    },

    __JD2JG__: function (JD, J1G0) {
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

        var d = this.int;
        var Mod = this.mod;

        var I = 0, J = 0, L = 0, M = 0, N = 0;

        J = 4 * JD + 139361631;
        if (J1G0 <= 0) J = J + d(d((4 * JD + 183187720) / 146097) * 3 / 4) * 4 - 3908;
        I = 308 + d(Mod(J, 1461) / 4) * 5;
        N = 1 + d(Mod(I, 153) / 5);
        M = 1 + Mod(d(I / 153), 12);
        L = d(J / 1461) - 100100 + d((8 - M) / 6);

        return { L: L, M: M, N: N };
    },

    __JalCal__: function (Jy) {
        var leap = 0;
        var Gy = 0;
        var March = 0;

        var d = this.int;
        var Mod = this.mod;

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
        var breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
        Gy = Jy + 621;
        var leapJ = -14;
        var jp = breaks[0];
        if (Jy < jp || Jy > breaks[19]) {
            //      print'(10x,a,i5,a,i5,a)',
            //*' Invalid Jalaali year number:',Jy,' (=',Gy,' Gregorian)'
        }
        //Find the limiting years for the Jalaali year Jy
        var jump = 0;
        for (var j = 1; j <= 19; j++) {
            var jm = breaks[j];
            jump = jm - jp;
            if (Jy < jm) break; // goto Label2;
            //Q:should these 2 lines be in the for loop?
            leapJ = leapJ + d(jump / 33) * 8 + d(Mod(jump, 33) / 4);
            //Label1:
            jp = jm;
        }
        // Label2:
        var N = Jy - jp;
        //Find the number of leap years from AD 621 to the beginning 
        //of the current Jalaali year in the Persian calendar
        leapJ = leapJ + d(N / 33) * 8 + d((Mod(N, 33) + 3) / 4);
        if (Mod(jump, 33) == 4 && (jump - N) == 4) leapJ = leapJ + 1;
        //and the same in the Gregorian calendar (until the year Gy)
        var leapG = d(Gy / 4) - d((d(Gy / 100) + 1) * 3 / 4) - 150;
        //Determine the Gregorian date of Farvardin the 1st
        March = 20 + leapJ - leapG;
        //Find how many years have passed since the last leap year
        if ((jump - N) < 6) N = N - jump + d((jump + 4) / 33) * 33;
        leap = Mod(Mod(N + 1, 33) - 1, 4);
        if (leap == -1) leap = 4;

        return { leap: leap, Gy: Gy, March: March };
    },

    __Jal2JD__: function (Jy, Jm, Jd) {
        //Converts a date of the Jalaali calendar to the Julian Day Number
        //Input:  Jy - Jalaali year (1 to 3100)
        //        Jm - month (1 to 12)
        //        Jd - day (1 to 29/31)
        //Output: Jal2JD - the Julian Day Number
        var d = this.int;
        var Mod = this.mod;

        var leap = 0, iGy = 0, March = 0;

        var buffer = this.__JalCal__(Jy);
        leap = buffer.leap;
        iGy = buffer.Gy;
        March = buffer.March;

        return this.__JG2JD__(iGy, 3, March, 0) + (Jm - 1) * 31 - d(Jm / 7) * (Jm - 7) + Jd - 1;
    },

    __JD2Jal__: function (JDN) {
        //Converts the Julian Day number to a date in the Jalaali calendar
        //Input: JDN - the Julian Day number
        //Output: Jy - Jalaali year (1 to 3100)
        //        Jm - month (1 to 12)
        //        Jd - day (1 to 29/31)

        //Calculate Gregorian year (L)
        var d = this.int;
        var Mod = this.mod;

        var Jy = 0, Jm = 0, Jd = 0;

        var L = 0, M = 0, N = 0;
        var buffer = this.__JD2JG__(JDN, 0);
        L = buffer.L; //TODO: + 1?
        M = buffer.M;
        N = buffer.N;

        Jy = L - 621;
        var leap = 0, iGy = 0, March = 0;
        buffer = this.__JalCal__(Jy);
        leap = buffer.leap;
        iGy = buffer.Gy;
        March = buffer.March;

        var JDN1F = this.__JG2JD__(L, 3, March, 0);

        //Find number of days that passed since 1 Farvardin
        var k = JDN - JDN1F;
        if (k >= 0) {
            if (k <= 185) {
                //The first 6 months
                Jm = 1 + d(k / 31);
                Jd = Mod(k, 31) + 1;
                return { Jy: Jy, Jm: Jm, Jd: Jd };
            }
            else {
                //The remaining months
                k = k - 186;
            }
        }
        else {
            //previous Jalaali year
            Jy = Jy - 1;
            k = k + 179;
            if (leap == 1) k = k + 1;
        }
        Jm = 7 + d(k / 30);
        Jd = Mod(k, 30) + 1;

        return { Jy: Jy, Jm: Jm, Jd: Jd };
    },

    persianToGregorian: function (year, month, day) {
        var jd = this.__Jal2JD__(year, month, day);
        var g = this.__JD2JG__(jd, 0);

        return { year: g.L, month: g.M, day: g.N };
    },

    gregorianToPersian: function (year, month, day) {
        var jd = this.__JG2JD__(year, month, day, 0);
        var p = this.__JD2Jal__(jd);

        return { year: p.Jy, month: p.Jm, day: p.Jd };
    },
};

