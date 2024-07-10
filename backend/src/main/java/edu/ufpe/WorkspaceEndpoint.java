package edu.ufpe;

import io.quarkus.logging.Log;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;

@Path("/workspaces")
public class WorkspaceEndpoint {

    @ConfigProperty(name = "edu.ufpe.tpvis.workspaces.path")
    String workspacesPath;

    @GET
    @Path("/{name}")
    @Produces(MediaType.APPLICATION_JSON)
    public String getWorkspace(@PathParam("name") String workspaceName) throws IOException {
        try {
            return Files.readString(java.nio.file.Path.of(workspacesPath + "/" + workspaceName + "/workspace.json"), StandardCharsets.UTF_8);
        } catch (Exception e) {
            Log.error(e);
            return e.toString();
        }

    }

    @PUT
    @Path("/{name}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public String saveWorkspace(@PathParam("name") String workspaceName, String workspaceJson) throws IOException {
        try {
            Files.writeString(java.nio.file.Path.of(workspacesPath + "/" + workspaceName + "/workspace.json"), workspaceJson);
        } catch (Exception e) {
            Log.error(e);
            return e.toString();
        }
        return workspaceJson;
    }

    @GET
    @Path("/{name}/testset/{uuid}")
    @Produces(MediaType.APPLICATION_JSON)
    public String getTestset(@PathParam("name") String workspaceName, @PathParam("uuid") String testsetUUID) throws IOException {
        try {
            return Files.readString(java.nio.file.Path.of(workspacesPath + "/" + workspaceName + "/testsets/" + testsetUUID), StandardCharsets.UTF_8);
        } catch (Exception e) {
            Log.error(e);
            return e.toString();
        }

    }

    @GET
    @Path("/{name}/prioritizations/{uuid}")
    @Produces(MediaType.APPLICATION_JSON)
    public String getPrioritization(@PathParam("name") String workspaceName, @PathParam("uuid") String testsetUUID) throws IOException {
        try {
            return Files.readString(java.nio.file.Path.of(workspacesPath + "/" + workspaceName + "/prioritizations/" + testsetUUID), StandardCharsets.UTF_8);
        }  catch (Exception e) {
            Log.error(e);
            return e.toString();
        }
    }

    @GET
    @Path("/{name}/call-graphs/{uuid}")
    @Produces(MediaType.TEXT_PLAIN)
    public String getCallGraph(@PathParam("name") String workspaceName, @PathParam("uuid") String calgraphUUID) throws IOException {
        try {
            return Files.readString(java.nio.file.Path.of(workspacesPath + "/" + workspaceName + "/call_graphs/" + calgraphUUID), StandardCharsets.UTF_8);
        } catch (Exception e) {
            Log.error(e);
            return e.toString();
        }

    }
}
