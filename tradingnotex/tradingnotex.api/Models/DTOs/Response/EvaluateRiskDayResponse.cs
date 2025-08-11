using System;
using System.Collections.Generic;

namespace TradingNoteX.Models.DTOs.Response
{
    public class EvaluateRiskDayResponse
    {
        public string Day { get; set; }
        public List<CurvePoint> Curve { get; set; }
        public decimal Final { get; set; }
        public decimal Disciplined { get; set; }
        public DateTime? HitGoalAt { get; set; }
        public DateTime? HitLossAt { get; set; }
        public bool Greed { get; set; }
        public bool LossBreach { get; set; }
        public decimal Impact { get; set; }
    }
}
