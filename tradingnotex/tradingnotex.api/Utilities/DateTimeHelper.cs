using System;
using System.Collections.Generic;

namespace TradingNoteX.Utilities
{
    public static class DateTimeHelper
    {
        public static DateTime StartOfDay(DateTime date)
        {
            return date.Date;
        }
        
        public static DateTime EndOfDay(DateTime date)
        {
            return date.Date.AddDays(1).AddTicks(-1);
        }
        
        public static DateTime StartOfWeek(DateTime date)
        {
            var diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
            return date.AddDays(-1 * diff).Date;
        }
        
        public static DateTime StartOfMonth(DateTime date)
        {
            return new DateTime(date.Year, date.Month, 1);
        }
        
        public static DateTime EndOfMonth(DateTime date)
        {
            return StartOfMonth(date).AddMonths(1).AddTicks(-1);
        }
        
        public static DateTime StartOfYear(DateTime date)
        {
            return new DateTime(date.Year, 1, 1);
        }
        
        public static List<DateTime> GetTradingDays(DateTime start, DateTime end)
        {
            var days = new List<DateTime>();
            var current = start.Date;
            
            while (current <= end.Date)
            {
                if (current.DayOfWeek != DayOfWeek.Saturday && current.DayOfWeek != DayOfWeek.Sunday)
                {
                    days.Add(current);
                }
                current = current.AddDays(1);
            }
            
            return days;
        }
    }
}
