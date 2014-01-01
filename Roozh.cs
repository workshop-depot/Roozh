using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace PersianRoozh
{
    public class Roozh
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public int Day { get; set; }

        public override string ToString()
        {
            return string.Format("{0,0000}-{1,00}-{2,00}", Year, Month, Day);
        }

        public static Roozh PersianToGregorian(int year, int month, int day)
        {
            var jd = Jal2JD(year, month, day);
            int L, M, N;
            JD2JG(jd, out L, out M, out N, 0);

            return new Roozh { Year = L, Month = M, Day = N };
        }

        public static Roozh GregorianToPersian(int year, int month, int day)
        {
            var jd = JG2JD(year, month, day, 0);
            int L, M, N;
            JD2Jal(jd, out L, out M, out N);

            return new Roozh { Year = L, Month = M, Day = N };
        }

        private static void JD2JG(int JD, out int L, out int M, out int N, int J1G0)
        {
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
            int I, J;
            J = 4 * JD + 139361631;
            if (J1G0 <= 0) J = J + (4 * JD + 183187720) / 146097 * 3 / 4 * 4 - 3908;
            I = Mod(J, 1461) / 4 * 5 + 308;
            N = Mod(I, 153) / 5 + 1;
            M = Mod(I / 153, 12) + 1;
            L = J / 1461 - 100100 + (8 - M) / 6;
        }

        private static void JD2Jal(int JDN, out int Jy, out int Jm, out int Jd)
        {
            //Converts the Julian Day number to a date in the Jalaali calendar
            //Input: JDN - the Julian Day number
            //Output: Jy - Jalaali year (1 to 3100)
            //        Jm - month (1 to 12)
            //        Jd - day (1 to 29/31)

            //Calculate Gregorian year (L)
            int L, M, N;
            JD2JG(JDN, out L, out M, out N, 0);
            Jy = L - 621;
            int leap, iGy, March;
            JalCal(Jy, out leap, out iGy, out March);
            int JDN1F = JG2JD(L, 3, March, 0);
            //Find number of days that passed since 1 Farvardin
            int k = JDN - JDN1F;
            if (k >= 0)
            {
                if (k <= 185)
                {
                    //The first 6 months
                    Jm = 1 + k / 31;
                    Jd = Mod(k, 31) + 1;
                    return;
                }
                else
                {
                    //The remaining months
                    k = k - 186;
                }
            }
            else
            {
                //previous Jalaali year
                Jy = Jy - 1;
                k = k + 179;
                if (leap == 1) k = k + 1;
            }
            Jm = 7 + k / 30;
            Jd = Mod(k, 30) + 1;
        }

        private static int JG2JD(int L, int M, int N, int J1G0)
        {
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

            int res = (L + (M - 8) / 6 + 100100) * 1461 / 4 + (153 * Mod(M + 9, 12) + 2) / 5 + N - 34840408;
            if (J1G0 <= 0) res = res - (L + 100100 + (M - 8) / 6) / 100 * 3 / 4 + 752;
            //MJD=JG2JD-2400000.5   ! this formula gives Modified Julian Day number
            return res;
        }

        private static void JalCal(int Jy, out int leap, out int Gy, out int March)
        {
            leap = 0;
            Gy = 0;
            March = 0;
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
            var breaks = new List<int>(new[] { -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178 }).ToArray();
            Gy = Jy + 621;
            int leapJ = -14;
            int jp = breaks[0];
            if (Jy < jp || Jy > breaks[19])
            {
                //      print'(10x,a,i5,a,i5,a)',
                //*' Invalid Jalaali year number:',Jy,' (=',Gy,' Gregorian)'
            }
            //Find the limiting years for the Jalaali year Jy
            int jump = 0;
            for (int j = 1; j <= 19; j++)
            {
                int jm = breaks[j];
                jump = jm - jp;
                if (Jy < jm) goto Label2;
                //Q:should these 2 lines be in the for loop?
                leapJ = leapJ + jump / 33 * 8 + Mod(jump, 33) / 4;
                //Label1:
                jp = jm;
            }
        Label2:
            int N = Jy - jp;
            //Find the number of leap years from AD 621 to the beginning 
            //of the current Jalaali year in the Persian calendar
            leapJ = leapJ + N / 33 * 8 + (Mod(N, 33) + 3) / 4;
            if (Mod(jump, 33) == 4 && (jump - N) == 4) leapJ = leapJ + 1;
            //and the same in the Gregorian calendar (until the year Gy)
            int leapG = Gy / 4 - (Gy / 100 + 1) * 3 / 4 - 150;
            //Determine the Gregorian date of Farvardin the 1st
            March = 20 + leapJ - leapG;
            //Find how many years have passed since the last leap year
            if ((jump - N) < 6) N = N - jump + (jump + 4) / 33 * 33;
            leap = Mod(Mod(N + 1, 33) - 1, 4);
            if (leap == -1) leap = 4;
        }

        private static int Jal2JD(int Jy, int Jm, int Jd)
        {
            //Converts a date of the Jalaali calendar to the Julian Day Number
            //Input:  Jy - Jalaali year (1 to 3100)
            //        Jm - month (1 to 12)
            //        Jd - day (1 to 29/31)
            //Output: Jal2JD - the Julian Day Number
            int leap, iGy, March;
            JalCal(Jy, out leap, out iGy, out March);
            return JG2JD(iGy, 3, March, 0) + (Jm - 1) * 31 - Jm / 7 * (Jm - 7) + Jd - 1;
        }

        private static int Mod(int a, int b) { return a % b; }
    }
}