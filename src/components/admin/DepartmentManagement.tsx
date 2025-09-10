import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  Building,
  Plus,
  Edit,
  Trash2,
  Search,
  Mail,
  Phone,
  Users,
  Eye,
  EyeOff
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  staff_count?: number;
  category_count?: number;
}

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contact_email: '',
    contact_phone: '',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching departments:', error);
      return;
    }

    // Get staff count and category count for each department
    const departmentsWithCounts = await Promise.all(
      (data || []).map(async (department) => {
        const [staffResult, categoryResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', department.id),
          supabase
            .from('categories')
            .select('*', { count: 'exact', head: true })
            .eq('department_id', department.id)
        ]);
        
        return { 
          ...department, 
          staff_count: staffResult.count || 0,
          category_count: categoryResult.count || 0
        };
      })
    );

    setDepartments(departmentsWithCounts);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isCreating) {
        const { error } = await supabase
          .from('departments')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Department Created",
          description: "The new department has been created successfully.",
        });
      } else if (selectedDepartment) {
        const { error } = await supabase
          .from('departments')
          .update(formData)
          .eq('id', selectedDepartment.id);

        if (error) throw error;

        toast({
          title: "Department Updated",
          description: "The department has been updated successfully.",
        });
      }

      resetForm();
      fetchDepartments();
    } catch (error) {
      console.error('Error saving department:', error);
      toast({
        title: "Error",
        description: "There was an error saving the department. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setFormData({
      name: department.name,
      description: department.description,
      contact_email: department.contact_email,
      contact_phone: department.contact_phone,
    });
    setIsCreating(false);
  };

  const handleCreate = () => {
    setSelectedDepartment(null);
    setFormData({
      name: '',
      description: '',
      contact_email: '',
      contact_phone: '',
    });
    setIsCreating(true);
  };

  const resetForm = () => {
    setSelectedDepartment(null);
    setIsCreating(false);
    setFormData({
      name: '',
      description: '',
      contact_email: '',
      contact_phone: '',
    });
  };

  const toggleDepartmentStatus = async (departmentId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('departments')
        .update({ is_active: !isActive })
        .eq('id', departmentId);

      if (error) throw error;

      toast({
        title: isActive ? "Department Deactivated" : "Department Activated",
        description: `The department has been ${isActive ? 'deactivated' : 'activated'}.`,
      });

      fetchDepartments();
    } catch (error) {
      console.error('Error toggling department status:', error);
      toast({
        title: "Error",
        description: "There was an error updating the department status.",
        variant: "destructive",
      });
    }
  };

  const deleteDepartment = async (departmentId: string) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', departmentId);

      if (error) throw error;

      toast({
        title: "Department Deleted",
        description: "The department has been deleted successfully.",
      });

      fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        title: "Error",
        description: "There was an error deleting the department. Make sure no staff or categories are assigned to this department.",
        variant: "destructive",
      });
    }
  };

  const filteredDepartments = departments.filter(department =>
    department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    department.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Department Management
              </CardTitle>
              <CardDescription>
                Manage municipal departments and their contact information
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Department
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {isCreating ? 'Create New Department' : 'Edit Department'}
                  </DialogTitle>
                  <DialogDescription>
                    {isCreating 
                      ? 'Add a new municipal department'
                      : 'Update the department details'
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Department Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Public Works"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of department responsibilities"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      placeholder="department@city.gov"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact_phone">Contact Phone</Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {isCreating ? 'Create Department' : 'Update Department'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Departments List */}
      <div className="grid gap-4">
        {filteredDepartments.map((department) => (
          <Card key={department.id} className={!department.is_active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {department.name}
                    {!department.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {department.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {department.contact_email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {department.contact_email}
                      </div>
                    )}
                    {department.contact_phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {department.contact_phone}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {department.staff_count} staff
                    </Badge>
                    <Badge variant="outline">
                      {department.category_count} categories
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleDepartmentStatus(department.id, department.is_active)}
                  >
                    {department.is_active ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-1" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(department)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Department</DialogTitle>
                        <DialogDescription>
                          Update the department details
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="name">Department Name</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="contact_email">Contact Email</Label>
                          <Input
                            id="contact_email"
                            type="email"
                            value={formData.contact_email}
                            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                          />
                        </div>

                        <div>
                          <Label htmlFor="contact_phone">Contact Phone</Label>
                          <Input
                            id="contact_phone"
                            type="tel"
                            value={formData.contact_phone}
                            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={resetForm}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            Update Department
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteDepartment(department.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {filteredDepartments.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No departments found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}