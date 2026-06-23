import { SupabaseProfileRepository } from "./repositories/SupabaseProfileRepository";
import { ProfileService } from "./services/ProfileService";
import { ProfileController } from "./controllers/ProfileController";

/**
 * Dependency injection container — wires repositories → services → controllers.
 *
 * To swap implementations (e.g. for testing), replace the repository here.
 * In tests, use InMemoryProfileRepository instead of SupabaseProfileRepository.
 */
function createContainer() {
  const profileRepository = new SupabaseProfileRepository();
  const profileService = new ProfileService(profileRepository);
  const profileController = new ProfileController(profileService);

  return {
    profileRepository,
    profileService,
    profileController,
  } as const;
}

export const container = createContainer();
