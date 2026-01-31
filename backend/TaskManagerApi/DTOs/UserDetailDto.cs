using System.Collections.Generic;

namespace TaskManagerApi.DTOs
{
    public class UserDetailDto : UserDto
    {
        public List<TaskSimpleDto>? Tasks { get; set; }
    }

    public class TaskSimpleDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
    }
}