import { Building2, Crown, Plus, Settings, Shield, Trash2, User as UserIcon, UserPlus, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import TeamForm from './TeamForm';

const TeamManager = ({ token, onRefresh, currentUser }) => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  const fetchTeams = useCallback(async () => {
    try {
      const response = await fetch('/teams', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }, [token]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const fetchTeamDetails = async (teamId) => {
    try {
      const response = await fetch(`/teams/${teamId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedTeam(data);
      }
    } catch (error) {
      console.error('Error fetching team details:', error);
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!selectedTeam || !inviteEmail) return;

    try {
      const response = await fetch(`/teams/${selectedTeam.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole
        })
      });

      if (response.ok) {
        setInviteEmail('');
        setShowInviteForm(false);
        fetchTeamDetails(selectedTeam.id);
        alert('User invited successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to invite user: ${error.detail}`);
      }
    } catch (error) {
      alert('Error inviting user');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!selectedTeam || !window.confirm('Are you sure you want to remove this member?')) return;

    try {
      const response = await fetch(`/teams/${selectedTeam.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchTeamDetails(selectedTeam.id);
        alert('Member removed successfully!');
      } else {
        alert('Failed to remove member');
      }
    } catch (error) {
      alert('Error removing member');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'admin': return <Shield className="w-4 h-4 text-blue-600" />;
      default: return <UserIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      owner: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      admin: 'bg-blue-100 text-blue-800 border-blue-200',
      member: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return styles[role] || styles.member;
  };

  const isTeamAdmin = (team) => {
    if (!currentUser || !team) return false;
    const member = team.members?.find(m => m.id === currentUser.id);
    return member && (member.role === 'owner' || member.role === 'admin');
  };

  const canManageTeam = selectedTeam && isTeamAdmin(selectedTeam);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">Teams</h3>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">Create Team</span>
        </button>
      </div>

      {teams.length === 0 ? (
        /* Empty State */
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-12 text-center border border-blue-100">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Users className="w-10 h-10 text-blue-600" />
          </div>
          <h4 className="text-xl font-bold text-gray-800 mb-2">No Teams Yet</h4>
          <p className="text-gray-600 mb-6">Create a team to collaborate with your colleagues</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium shadow-md hover:shadow-lg transition-all"
          >
            Create Your First Team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Teams List */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Your Teams</h4>
            <div className="space-y-3">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className={`bg-white border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedTeam?.id === team.id 
                      ? 'border-blue-500 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => fetchTeamDetails(team.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-gray-900 mb-1">{team.display_name}</h5>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {team.member_count} members
                        </span>
                        <span className="flex items-center gap-1">
                          <Settings className="w-3 h-3" />
                          {team.data_source_count} sources
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Details */}
          <div>
            {selectedTeam ? (
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 space-y-6">
                {/* Team Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-1">{selectedTeam.display_name}</h4>
                    {selectedTeam.description && (
                      <p className="text-sm text-gray-600">{selectedTeam.description}</p>
                    )}
                  </div>
                  {canManageTeam && (
                    <button
                      onClick={() => setShowInviteForm(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 text-sm font-medium shadow-md hover:shadow-lg transition-all"
                    >
                      <UserPlus className="w-4 h-4" />
                      Invite
                    </button>
                  )}
                </div>

                {/* Members List */}
                <div>
                  <h5 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Members ({selectedTeam.members?.length || 0})
                  </h5>
                  <div className="space-y-2">
                    {selectedTeam.members?.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                            {(member.full_name || member.username)[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.full_name || member.username}</p>
                            <p className="text-xs text-gray-600">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadge(member.role)}`}>
                            {getRoleIcon(member.role)}
                            <span className="capitalize">{member.role}</span>
                          </span>
                          {canManageTeam && member.role !== 'owner' && (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove member"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {!canManageTeam && (
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <p className="text-xs text-blue-800 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>Only team admins can manage members and settings</span>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 rounded-xl p-12 text-center">
                <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 font-medium">Select a team to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Team Form */}
      {showCreateForm && (
        <TeamForm
          token={token}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchTeams();
            onRefresh();
          }}
        />
      )}

      {/* Invite User Form */}
      {showInviteForm && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Invite User</h3>
            <p className="text-sm text-gray-600 mb-6">Add a new member to {selectedTeam.display_name}</p>
            
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="user@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                >
                  <option value="member">👤 Member - Can view and use team resources</option>
                  <option value="admin">🛡️ Admin - Can manage team and members</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManager;
