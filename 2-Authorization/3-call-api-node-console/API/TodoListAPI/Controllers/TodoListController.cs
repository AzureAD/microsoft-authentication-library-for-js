using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using Microsoft.Identity.Web.Resource;
using TodoListAPI.Models;

namespace TodoListAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class TodoListController : ControllerBase
    {
        private readonly TodoContext _context;
        
        public TodoListController(TodoContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Indicates if the AT presented has application or delegated permissions.
        /// </summary>
        /// <returns></returns>
        private bool IsAppOnlyToken()
        {
            // Add in the optional 'idtyp' claim to check if the access token is coming from an application or user.
            // See: https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-optional-claims
            if (HttpContext.User.Claims.Any(c => c.Type == "idtyp"))
            {
                return HttpContext.User.Claims.Any(c => c.Type == "idtyp" && c.Value == "app");
            }
            else
            {
                // alternatively, if an AT contains the roles claim but no scp claim, that indicates it's an app token
                return HttpContext.User.Claims.Any(c => c.Type == "roles") && HttpContext.User.Claims.Any(c => c.Type != "scp");
            }
        }

        // GET: api/TodoItems
        [HttpGet]
        /// <summary>
        /// Access tokens that have neither the 'scp' (for delegated permissions) nor
        /// 'roles' (for application permissions) claim are not to be honored.
        ///
        /// An access token issued by Azure AD will have at least one of the two claims. Access tokens
        /// issued to a user will have the 'scp' claim. Access tokens issued to an application will have
        /// the roles claim. Access tokens that contain both claims are issued only to users, where the scp
        /// claim designates the delegated permissions, while the roles claim designates the user's role.
        ///
        /// To determine whether an access token was issued to a user (i.e delegated) or an application
        /// more easily, we recommend enabling the optional claim 'idtyp'. For more information, see:
        /// https://docs.microsoft.com/azure/active-directory/develop/access-tokens#user-and-application-tokens
        /// </summary>
        [RequiredScopeOrAppPermission(
            RequiredScopesConfigurationKey = "AzureAD:Scopes:Read",
            RequiredAppPermissionsConfigurationKey = "AzureAD:AppPermissions:Read"
        )]
        public async Task<ActionResult<IEnumerable<TodoItem>>> GetTodoItems()
        {
            if (!IsAppOnlyToken())
            {
                /// <summary>
                /// The 'oid' (object id) is the only claim that should be used to uniquely identify
                /// a user in an Azure AD tenant. The token might have one or more of the following claim,
                /// that might seem like a unique identifier, but is not and should not be used as such:
                ///
                /// - upn (user principal name): might be unique amongst the active set of users in a tenant
                /// but tend to get reassigned to new employees as employees leave the organization and others
                /// take their place or might change to reflect a personal change like marriage.
                ///
                /// - email: might be unique amongst the active set of users in a tenant but tend to get reassigned
                /// to new employees as employees leave the organization and others take their place.
                /// </summary>
                return await _context.TodoItems.Where(x => x.Owner == HttpContext.User.GetObjectId()).ToListAsync();
            }
            else
            {
                if(!_context.TodoItems.Any()) {
                    _context.TodoItems.Add(new TodoItem() { Id = 1, Description = "Pick up grocerie", Owner = "00000000-0000-0000-66f3-3332eca7ea81", Status = true });
                    _context.TodoItems.Add(new TodoItem() { Id = 2, Description = "Finish invoice report", Owner = "00000000-0000-0000-0000-3332eca7ea81", Status = true });
                    _context.TodoItems.Add(new TodoItem() { Id = 3, Description = "Water plants", Owner = "00000000-0000-0000-6666-3332eca7ea81", Status = false });
                    await _context.SaveChangesAsync();
                }
                return await _context.TodoItems.ToListAsync();
            }
        }

        // GET: api/TodoItems/5
        [HttpGet("{id}")]
        [RequiredScopeOrAppPermission(
            RequiredScopesConfigurationKey = "AzureAD:Scopes:Read",
            RequiredAppPermissionsConfigurationKey = "AzureAD:AppPermissions:Read"
        )]
        public async Task<ActionResult<TodoItem>> GetTodoItem(int id)
        {
            // if it only has delegated permissions, then it will be t.id==id && x.Owner == owner
            // if it has app permissions the it will return t.id==id
            if (!IsAppOnlyToken())
            {
                return await _context.TodoItems.FirstOrDefaultAsync(t => t.Id == id && t.Owner == HttpContext.User.GetObjectId());
            }
            else
            {
                return await _context.TodoItems.FirstOrDefaultAsync(t => t.Id == id);
            }
        }

        // PUT: api/TodoItems/5
        // To protect from overposting attacks, please enable the specific properties you want to bind to, for
        // more details see https://aka.ms/RazorPagesCRUD.
        [HttpPut("{id}")]
        [RequiredScopeOrAppPermission(
            RequiredScopesConfigurationKey = "AzureAD:Scopes:Write",
            RequiredAppPermissionsConfigurationKey = "AzureAD:AppPermissions:Write"
        )]
        public async Task<IActionResult> PutTodoItem(int id, TodoItem todoItem)
        {
            if (id != todoItem.Id  || !_context.TodoItems.Any(x => x.Id == id))
            {
                return NotFound();
            }


            if ((!IsAppOnlyToken() && _context.TodoItems.Any(x => x.Id == id && x.Owner == HttpContext.User.GetObjectId()))
                ||
                IsAppOnlyToken())
            {
                if (_context.TodoItems.Any(x => x.Id == id && x.Owner == HttpContext.User.GetObjectId()))
                {
                    _context.Entry(todoItem).State = EntityState.Modified;

                    try
                    {
                        await _context.SaveChangesAsync();
                    }
                    catch (DbUpdateConcurrencyException)
                    {
                        if (!_context.TodoItems.Any(e => e.Id == id))
                        {
                            return NotFound();
                        }
                        else
                        {
                            throw;
                        }
                    }
                }
            }

            return NoContent();
        }

        // POST: api/TodoItems
        // To protect from overposting attacks, please enable the specific properties you want to bind to, for
        // more details see https://aka.ms/RazorPagesCRUD.
        [HttpPost]
        [RequiredScopeOrAppPermission(
            RequiredScopesConfigurationKey = "AzureAD:Scopes:Write",
            RequiredAppPermissionsConfigurationKey = "AzureAD:AppPermissions:Write"
        )]
        public async Task<ActionResult<TodoItem>> PostTodoItem(TodoItem todoItem)
        {
            string owner = HttpContext.User.GetObjectId();

            if (IsAppOnlyToken())
            {
                // with such a permission any owner name is accepted
                owner = todoItem.Owner;
            }

            todoItem.Owner = owner;
            todoItem.Status = false;

            _context.TodoItems.Add(todoItem);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetTodoItem", new { id = todoItem.Id }, todoItem);
        }

        // DELETE: api/TodoItems/5
        [HttpDelete("{id}")]
        [RequiredScopeOrAppPermission(
            RequiredScopesConfigurationKey = "AzureAD:Scopes:Write",
            RequiredAppPermissionsConfigurationKey = "AzureAD:AppPermissions:Write"
        )]
        public async Task<ActionResult<TodoItem>> DeleteTodoItem(int id)
        {
            TodoItem todoItem = await _context.TodoItems.FindAsync(id);

            if (todoItem == null)
            {
                return NotFound();
            }

            if ((!IsAppOnlyToken() && _context.TodoItems.Any(x => x.Id == id && x.Owner == HttpContext.User.GetObjectId()))
                ||
                IsAppOnlyToken())
            {
                _context.TodoItems.Remove(todoItem);
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }
    }
}
