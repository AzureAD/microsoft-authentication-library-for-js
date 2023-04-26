using System;

namespace ToDoListAPI.Models;

public class ToDo
{
    public int Id { get; set; }
    public Guid Owner { get; set; }
    public string Description { get; set; } = string.Empty;
}