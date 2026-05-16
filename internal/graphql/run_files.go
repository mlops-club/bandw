package graphql

import (
	"fmt"

	"github.com/mlops-club/bandw/internal/store"
)

// ─── Input type ─────────────────────────────────────────────────

type createRunFilesInput struct {
	EntityName  string
	ProjectName string
	RunName     string
	Files       []string
}

// ─── Payload resolvers ──────────────────────────────────────────

// createRunFilesPayloadResolver resolves the CreateRunFilesPayload type.
type createRunFilesPayloadResolver struct {
	runID   string
	headers []string
	files   []*runFileUploadInfoResolver
}

func (r *createRunFilesPayloadResolver) RunID() *string          { return &r.runID }
func (r *createRunFilesPayloadResolver) UploadHeaders() []string { return r.headers }
func (r *createRunFilesPayloadResolver) Files() *[]*runFileUploadInfoResolver {
	return &r.files
}

type runFileUploadInfoResolver struct {
	name      string
	uploadUrl string
}

func (r *runFileUploadInfoResolver) Name() string       { return r.name }
func (r *runFileUploadInfoResolver) UploadUrl() *string { return &r.uploadUrl }

// ─── Mutation ───────────────────────────────────────────────────

// CreateRunFiles implements the createRunFiles mutation.
func (r *Resolver) CreateRunFiles(args struct{ Input createRunFilesInput }) (*createRunFilesPayloadResolver, error) {
	in := args.Input

	// Resolve project and run.
	project, err := store.GetProjectByEntityAndName(r.db, in.EntityName, in.ProjectName)
	if err != nil {
		return nil, fmt.Errorf("project %s/%s not found: %w", in.EntityName, in.ProjectName, err)
	}
	run, err := store.GetRunByName(r.db, project.ID, in.RunName)
	if err != nil {
		return nil, fmt.Errorf("run %q not found: %w", in.RunName, err)
	}

	files := make([]*runFileUploadInfoResolver, 0, len(in.Files))
	for _, fileName := range in.Files {
		storagePath := ""
		uploadURL := ""
		if r.store != nil {
			storagePath = fmt.Sprintf("runs/%s/%s", run.ID, fileName)
			uploadURL = r.store.UploadURL(storagePath)
		}

		// Upsert: if a file with this name already exists for this run, update it.
		var existing store.RunFile
		err := r.db.Where("run_id = ? AND name = ?", run.ID, fileName).First(&existing).Error
		if err == nil {
			// Update existing record.
			r.db.Model(&existing).Updates(map[string]interface{}{
				"storage_path": storagePath,
				"upload_url":   uploadURL,
			})
		} else {
			// Create new record.
			rf := store.RunFile{
				RunID:       run.ID,
				Name:        fileName,
				StoragePath: storagePath,
				UploadURL:   uploadURL,
			}
			if err := r.db.Create(&rf).Error; err != nil {
				return nil, fmt.Errorf("create run file %q: %w", fileName, err)
			}
		}

		files = append(files, &runFileUploadInfoResolver{
			name:      fileName,
			uploadUrl: uploadURL,
		})
	}

	return &createRunFilesPayloadResolver{
		runID:   run.ID,
		headers: []string{},
		files:   files,
	}, nil
}
