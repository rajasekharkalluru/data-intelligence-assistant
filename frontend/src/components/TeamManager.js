import React, { useState, useEffect } from 'react';
import { Plus, Users, Settings, UserPlus, Crown, Shield, User as UserIcon, Trash2 } from 'lucide-react';
import TeamForm from './TeamForm';

const TeamManager = ({ token, onRefresh }) => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
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
  };

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
    if (!selectedTeam || !confirm('Are you sure you want to remove this member?')) return;

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
      case 'owner': return <Crown size={14} className="text-yellow-600" />;
      case 'admin': return <Shield size={14} className="text-blue-600" />;
      default: return <UserIcon size={14} className="text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Team Management</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          Create Team
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teams List */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Your Teams</h4>
          {teams.map((team) => (
            <div
              key={team.id}
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                selectedTeam?.id === team.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => fetchTeamDetails(team.id)}
            >
              <div className="flex items-center gap-3">
                <Users size={20} className="text-gray-600" />
                <div className="flex-1">
                  <h5 className="font-medium">{team.display_name}</h5>
                  <p className="text-sm text-gray-600">
                    {team.member_count} members • {team.data_source_count} sources
                  </p>
                </div>
              </div>
            </div>
          ))}

          {teams.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <p>No teams yet</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-2 text-blue-600 hover:text-blue-700"
              >
                Create your first team
              </button>
            </div>
          )}
        </div>

        {/* Team Details */}
        <div>
          {selectedTeam ? (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">{selectedTeam.display_name}</h4>
                <button
                  onClick={() => setShowInviteForm(true)}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  <UserPlus size={14} />
                  Invite
                </button>
              </div>

              {selectedTeam.description && (
                <p className="text-gray-600 mb-4">{selectedTeam.description}</p>
              )}

              <div className="space-y-3">
                <h5 className="font-medium text-gray-900">Members ({selectedTeam.members.length})</h5>
                {selectedTeam.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        {member.full_name ? member.full_name[0].toUpperCase() : member.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{member.full_name || member.username}</p>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {getRoleIcon(member.role)}
                        <span className="text-sm capitalize">{member.role}</span>
                      </div>
                      {member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-8 text-center text-gray-500">
              <Settings size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Select a team to view details</p>
            </div>
          )}
        </div>
      </div>

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
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium mb-4">Invite User to {selectedTeam.display_name}</h3>
            
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="user@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
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