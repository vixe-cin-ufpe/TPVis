# TPVis: Test Case Prioritization Visualization
Demo video: https://youtu.be/9bkLAHVkpXw

This is the full source code for TPVis, presented in:

> José Arthur Silveira, Leandro Vieira, Nivan Ferreira. 2024. TPVis: A visual analytics system for exploring test case prioritization methods. Computers & Graphics, Volume 124, 2024, 104064, ISSN 0097-8493. DOI: [10.1016/j.cag.2024.104064](https://doi.org/10.1016/j.cag.2024.104064).


## Preparing a dataset

TPVis datasets (called workspaces) are flexible and can be built for any application. In this repository, we do include a sample one (used in our paper) for demonstration purposes. It may also be used as a reference to build your own.

```bash
7z x ./workspaces/FAST.7z.001 -o./workspaces
```

After unziping the archieve, you will be presented the following directory structure:

     ./workspaces/FAST
     |
     |--- call_graphs/                Holds information for the coverage evolution tool. 
     |
     |--- prioritizations/            Holds prioritization data. Each file is composed of a single json array of test ids.
     |
     |--- testsets/                   Holds test set data. Each file contains a json array of each test and all its related metada.
     |
     |--- workspace.json              Holds the prioritization tree data and reffers to all corresponding file in the workspaces' subdirectories
     |
     |--- workspace-NO-METRICS.json   A sample workspace file (not required or used) for a workspace without APFD metric calculated.

## Running TPVis

### Using Docker

Usually, users may prefer to run TPVis using docker (https://docs.docker.com/engine/install/). In this repository, we provide a docker image to build and run the application. 

```bash
docker compose up --build
```

> [!TIP]
> The docker-compose file will mount a volume to the container for the "workspaces" directory. Some additional file permission configuration may be necessary depending on your platform. 

TPVis will be listening by default on `http://localhost:8082/?workspace=<workspace-name>`. If you're using the sample dataset, the URL should be `http://localhost:8082/?workspace=FAST`

### Development mode

TPVis is a standard Angular frontend + Quarkus backend (JDK 17) web application. Please refer to the official framework guides to run TPVis in development mode.
- [Angular documentation](https://v16.angular.io/docs)
   * [Getting Started](https://v16.angular.io/start)
   * [Setup local environment workspace](https://v16.angular.io/guide/setup-local)
- [Quarkus documentation](https://quarkus.io/version/3.2/guides/#)
   * [Getting Started](https://quarkus.io/version/3.2/guides/getting-started)
   * [Running via an IDE](https://quarkus.io/version/3.2/guides/ide-tooling)


