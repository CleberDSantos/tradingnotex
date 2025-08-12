namespace TradingNoteX.Models.DTOs.Request
{
    public class AddCommentRequest
    {
        public string Text { get; set; }
        public string? Screenshot { get; set; } // Mantido para compatibilidade
        public List<AttachmentDto> Attachments { get; set; } = new List<AttachmentDto>();
    }

    public class AttachmentDto
    {
        public string Type { get; set; }
        public string Data { get; set; }
        public string Filename { get; set; }
        public long Size { get; set; }
        public string MimeType { get; set; }
    }
}
