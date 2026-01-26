using ChatComunitario.DTOs;
using ChatComunitario.Exceptions;
using ChatComunitario.Interfaces;
using ChatComunitario.Models;
using ChatComunitario.Repositories;

namespace ChatComunitario.Services;

/// <summary>
/// Servicio de gestión de comunidades
/// </summary>
public class CommunityService : ICommunityService
{
    private readonly CommunityRepository _communityRepository;
    private readonly UserRepository _userRepository;

    public CommunityService(CommunityRepository communityRepository, UserRepository userRepository)
    {
        _communityRepository = communityRepository;
        _userRepository = userRepository;
    }

    public async Task<(bool Success, Community? Community, string Message)> CreateCommunityAsync(CreateCommunityDto dto)
    {
        try
        {
            Console.WriteLine($"[DEBUG] CreateCommunityAsync - Title: '{dto.Title}', OwnerCedula: '{dto.OwnerCedula}'");
            
            var owner = await _userRepository.GetByCedulaAsync(dto.OwnerCedula);
            if (owner == null)
            {
                Console.WriteLine($"[DEBUG] Owner not found with cedula: '{dto.OwnerCedula}'");
                throw new NotFoundException("Usuario propietario", dto.OwnerCedula);
            }

            Console.WriteLine($"[DEBUG] Owner found: {owner.Name} {owner.LastName}");

            var community = new Community
            {
                Title = dto.Title,
                Description = dto.Description,
                OwnerCedula = dto.OwnerCedula
            };

            await _communityRepository.AddAsync(community);
            
            // Guardar cambios inmediatamente
            await _communityRepository.SaveAsync();
            Console.WriteLine($"[DEBUG] Community saved with ID: {community.Id}");

            // Verificar que se guardó
            var savedCommunity = await _communityRepository.GetByIdAsync(community.Id);
            if (savedCommunity == null)
            {
                Console.WriteLine($"[ERROR] Community was not persisted to database!");
                throw new Exception("La comunidad no se guardó correctamente");
            }
            
            Console.WriteLine($"[DEBUG] Community verified in database: {savedCommunity.Title}");

            return (true, community, "Comunidad creada exitosamente");
        }
        catch (BusinessException ex)
        {
            Console.WriteLine($"[DEBUG] BusinessException: {ex.Message}");
            return (false, null, ex.Message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DEBUG] Exception: {ex.Message}");
            Console.WriteLine($"[DEBUG] Stack trace: {ex.StackTrace}");
            return (false, null, $"Error: {ex.Message}");
        }
    }

    public async Task<(bool Success, IEnumerable<CommunityResponse> Communities, string Message)> GetAllCommunitiesAsync()
    {
        try
        {
            var communities = await _communityRepository.GetAllWithRelationsAsync();
            var responses = communities.Select(MapCommunityToResponse).ToList();

            return (true, responses, "Comunidades obtenidas exitosamente");
        }
        catch (Exception ex)
        {
            return (false, new List<CommunityResponse>(), $"Error: {ex.Message}");
        }
    }

    public async Task<(bool Success, IEnumerable<CommunityResponse> Communities, string Message)> GetCommunitiesByUserAsync(string cedula)
    {
        try
        {
            Console.WriteLine($"[DEBUG] GetCommunitiesByUserAsync called with cedula: '{cedula}'");
            var communities = await _communityRepository.GetByUserCedulaAsync(cedula);
            Console.WriteLine($"[DEBUG] Found {communities.Count()} communities");
            var responses = communities.Select(MapCommunityToResponse).ToList();
            foreach (var resp in responses)
            {
                Console.WriteLine($"[DEBUG] Community: {resp.Title}, Owner: {resp.OwnerCedula}");
            }

            return (true, responses, "Comunidades del usuario obtenidas exitosamente");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DEBUG] Error in GetCommunitiesByUserAsync: {ex.Message}");
            return (false, new List<CommunityResponse>(), $"Error: {ex.Message}");
        }
    }

    public async Task<(bool Success, CommunityResponse? Community, string Message)> GetCommunityByIdAsync(Guid id)
    {
        try
        {
            var community = await _communityRepository.GetByIdWithRelationsAsync(id);
            if (community == null)
            {
                throw new NotFoundException("Comunidad", id);
            }

            var response = MapCommunityToResponse(community);

            return (true, response, "Comunidad obtenida exitosamente");
        }
        catch (BusinessException ex)
        {
            return (false, null, ex.Message);
        }
        catch (Exception ex)
        {
            return (false, null, $"Error: {ex.Message}");
        }
    }

    public async Task<(bool Success, Community? Community, string Message)> UpdateCommunityAsync(Guid id, CreateCommunityDto dto)
    {
        try
        {
            var community = await _communityRepository.GetByIdAsync(id);
            if (community == null)
            {
                throw new NotFoundException("Comunidad", id);
            }

            community.Title = dto.Title;
            community.Description = dto.Description;

            await _communityRepository.UpdateAsync(community);
            await _communityRepository.SaveAsync();

            return (true, community, "Comunidad actualizada exitosamente");
        }
        catch (BusinessException ex)
        {
            return (false, null, ex.Message);
        }
        catch (Exception ex)
        {
            return (false, null, $"Error: {ex.Message}");
        }
    }

    public async Task<(bool Success, string Message)> DeleteCommunityAsync(Guid id)
    {
        try
        {
            var community = await _communityRepository.GetByIdAsync(id);
            if (community == null)
            {
                throw new NotFoundException("Comunidad", id);
            }

            await _communityRepository.DeleteAsync(community);
            await _communityRepository.SaveAsync();

            return (true, "Comunidad eliminada exitosamente");
        }
        catch (BusinessException ex)
        {
            return (false, ex.Message);
        }
        catch (Exception ex)
        {
            return (false, $"Error: {ex.Message}");
        }
    }

    public async Task<(bool Success, string Message)> AddMemberAsync(Guid communityId, AddMemberDto dto)
    {
        try
        {
            var community = await _communityRepository.GetByIdAsync(communityId);
            if (community == null)
            {
                throw new NotFoundException("Comunidad", communityId);
            }

            var user = await _userRepository.GetByCedulaAsync(dto.CedulaMember);
            if (user == null)
            {
                throw new NotFoundException("Usuario", dto.CedulaMember);
            }

            var existingMember = community.Members.FirstOrDefault(
                m => m.UserCedula == dto.CedulaMember);

            if (existingMember != null)
            {
                throw new ConflictException("El usuario ya es miembro de la comunidad");
            }

            var membership = new CommunityMember
            {
                CommunityId = communityId,
                UserCedula = dto.CedulaMember
            };

            community.Members.Add(membership);
            await _communityRepository.UpdateAsync(community);
            await _communityRepository.SaveAsync();

            return (true, "Miembro agregado exitosamente");
        }
        catch (BusinessException ex)
        {
            return (false, ex.Message);
        }
        catch (Exception ex)
        {
            return (false, $"Error: {ex.Message}");
        }
    }

    public async Task<(bool Success, string Message)> RemoveMemberAsync(Guid communityId, string cedula)
    {
        try
        {
            var community = await _communityRepository.GetByIdWithRelationsAsync(communityId);
            if (community == null)
            {
                throw new NotFoundException("Comunidad", communityId);
            }

            var membership = community.Members.FirstOrDefault(
                m => m.UserCedula == cedula);

            if (membership == null)
            {
                throw new NotFoundException("Miembro", cedula);
            }

            community.Members.Remove(membership);
            await _communityRepository.UpdateAsync(community);
            await _communityRepository.SaveAsync();

            return (true, "Miembro eliminado exitosamente");
        }
        catch (BusinessException ex)
        {
            return (false, ex.Message);
        }
        catch (Exception ex)
        {
            return (false, $"Error: {ex.Message}");
        }
    }

    private static CommunityResponse MapCommunityToResponse(Community community)
    {
        return new CommunityResponse
        {
            Id = community.Id,
            Title = community.Title,
            Description = community.Description,
            OwnerCedula = community.OwnerCedula,
            Owner = new UserResponse
            {
                Cedula = community.Owner.Cedula,
                Name = community.Owner.Name,
                LastName = community.Owner.LastName,
                Email = community.Owner.Email,
                ProfileImg = community.Owner.ProfileImg
            },
            Members = community.Members.Select(m => new UserResponse
            {
                Cedula = m.User.Cedula,
                Name = m.User.Name,
                LastName = m.User.LastName,
                Email = m.User.Email,
                ProfileImg = m.User.ProfileImg
            }).ToList(),
            Channels = community.Channels.Select(ch => new ChannelResponse
            {
                Id = ch.Id,
                Name = ch.Name,
                Description = ch.Description
            }).ToList()
        };
    }
}
